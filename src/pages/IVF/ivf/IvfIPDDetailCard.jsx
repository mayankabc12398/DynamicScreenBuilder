import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  bindHashCode,
  bindPanelByPatientID,
  GetBindDoctorDept,
} from "../../../networkServices/opdserviceAPI";
import DetailsCardForDefaultValue from "../../../components/commonComponents/DetailsCardForDefaultValue";
import ReactSelect from "../../../components/formComponent/ReactSelect";
import DatePicker from "../../../components/formComponent/DatePicker";
import MultiSelectComp from "../../../components/formComponent/MultiSelectComp";
import TimePicker from "../../../components/formComponent/TimePicker";
import Input from "../../../components/formComponent/Input";
import {
  AdmissionType,
  BasicMasterBindPro,
  BasicMasterSavePro,
  BillingCategory,
  BillingIPDSaveReferDoctor,
  GetBindRoomBedIVF,
  GetIVFPackages,
  GetIVFRoomType,
  GetPatientAdmissionDetails,
  handleSaveIVFAdmission,
  IPDAdmissionReport,
  SaveIPDAdmission,
  UpdatePatientAdmissionDetails,
} from "../../../networkServices/BillingsApi";
import {
  filterByTypes,
  handleIVFSaveIPDAdmissionPayload,
  handleReactSelectDropDownOptions,
  handlereferDocotorIDByReferalType,
  // handleSaveIPDAdmissionPayload,
  handleUpdateIPDAdmissionPayload,
  inputBoxValidation,
  notify,
  parseTimeString,
  ReactSelectisDefaultValue,
} from "../../../utils/utils";
import { useDispatch, useSelector } from "react-redux";
import {
  CentreWiseCacheByCenterID,
  GetBindDepartment,
  GetBindReferalType,
  GetBindReferDoctor,
} from "../../../store/reducers/common/CommonExportFunction";
import {
  MapGeneric_OPTION,
  MOBILE_NUMBER_VALIDATION_REGX,
  ReferedSourceConst,
} from "../../../utils/constant";
import { useLocalStorage } from "../../../utils/hooks/useLocalStorage";
import { useLocation } from "react-router-dom";
import { RedirectURL } from "../../../networkServices/PDFURL";
import moment from "moment";
import Modal from "../../../components/modalComponent/Modal";
import ReferDoctorModal from "../../Billing/IPD/ReferDoctorModal";
import DynamicForm from "../../../components/formComponent/DynamicForm";
import LabelInputBox from "../../../components/formComponent/LabelInputCheckbox";
import { CurrentStockGeneralConsertForm } from "../../../networkServices/CollectionReportApi";
import {
  handleFormG,
  handleIVFCASESHEET,
  handleMINISTRYOFHEALTH,
} from "../../../networkServices/IVFCounsellingAPI";
import clsx from "clsx";
import { translateOptions } from "@components/WrapTranslate";
import Heading from "../../../components/UI/Heading";

const IvfIPDDetailCard = ({
  SearchPatient,
  singlePatientData,
  data,
  ModalComponent,
  setVisible,
  sendReset,
  bindDetailAPI,
}) => {
  const [t] = useTranslation();
  const dispatch = useDispatch();
  let ip = useLocalStorage("ip", "get");
  const location = useLocation();
  const { VITE_DATE_FORMAT } = import.meta.env;
  const { PageConfigurationAPIList, BindResource } = useSelector(
    (state) => state.CommonSlice,
  );
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const [handleModelData, setHandleModelData] = useState({});
  const [modalData, setModalData] = useState({});
  const [relation, setRelation] = useState({
    RelationOf: "",
    IsPersonal: 1,
    RelationName: "",
    RelationPhone: "",
  });
  const [relationsOnEdit, setRelationsOnEdit] = useState([]);
  const relationCheckList = singlePatientData?.PatientRelationData?.filter(
    (rel) => rel?.IsPersonal === 1,
  );
  const [selectedRelations, setSelectedRelations] = useState(
    !data ? relationCheckList : [],
  );
  const [DropDownState, setDropDownState] = useState({
    getBindPanelByPatientID: [],
    getBindProList: [],
    getDoctorDeptWise: [],
    doctorMulti: [],
    getRoomType: [],
    getBillingCategory: [],
    getBindRoomBed: [],
    getAdmissionType: [],
    getPackage: [],
  });
  const relationsData = data ? relationsOnEdit : relationCheckList;
  const initialState = {
    panelID: "",
    TPA: "",
    MLC: "",
    admittedBy: "",
    referalTypeID: { label: "Self", value: 4 },
    referDoctorID: "",
    proId: "",
    DepartmentID: "ALL",
    DoctorID: [],
    ConsultingDoctor: "",
    dateOfVisit: new Date(),
    time: new Date(),
    admissionType: "",
    IPDCaseTypeID: "",
    RoomBed: DropDownState?.getBindRoomBed?.[0]?.RoomId || "",
    BillingCategory:
      DropDownState?.getBillingCategory?.[0]?.IPDCaseTypeID || "",
    ReferedSource: "",
    requestedRoomType: "",
    IssuedVisitorCardNo: "",
    admissionReason: "",
    treatment: "",
    ECHS: "",
    diagnosis: "",
    RoomName: "",
    IPDCaseTypeName: "",
    Package: "",
  };
  const [payloadData, setPayloadData] = useState({ ...initialState });
  const [errors, setErrors] = useState({});
  const [packageList, setPackageList] = useState([]);
  // Idempotency key to stop the same IVF admission being saved multiple times (repeat
  // submits / slow-network retries). Sent to the API as pmh.UniqueHash and stored in
  // patient_medical_history.UniqueHash for server-side dedupe. Refreshed whenever a
  // new patient is loaded so each admission gets its own key.
  const [uniqueHash, setUniqueHash] = useState("");
  const generateUniqueHash = async () => {
    const hashcode = await bindHashCode();
    setUniqueHash(hashcode?.data ?? "");
  };
  useEffect(() => {
    generateUniqueHash();
  }, [singlePatientData?.PatientID]);
  const { GetBindReferDoctorList, GetReferTypeList, GetDepartmentList } =
    useSelector((state) => state?.CommonSlice);
  const [updataDataList, setUpdataDataList] = useState([]);

  console.log(BindResource?.IVFRoomTypeId, "zzzzzzz");
  useEffect(() => {
    if (!BindResource) return;
    setPayloadData((prev) => ({
      ...prev,
      IPDCaseTypeID: BindResource?.IVFRoomTypeId,
      //   RoomBed: DropDownState?.getBindRoomBed?.[0]?.RoomId || "",
    }));
    getBindRoom({ caseType: BindResource?.IVFRoomTypeId });
  }, [BindResource, payloadData?.IPDCaseTypeID]);
  const ErrorHandling = () => {
    let errors = {};
    if (payloadData?.panelID == "") {
      errors.panelID = "panelID Is Required";
    }
    if (payloadData?.referalTypeID == "") {
      errors.referalTypeID = "referalTypeID Is Required";
    }
    if (payloadData?.referalTypeID == "") {
      errors.referalTypeID = "referalTypeID Is Required";
    }
    if (!payloadData?.DoctorID?.length > 0) {
      errors.DoctorID = "Doctor field Is Required";
    }
    if (!payloadData?.dateOfVisit) {
      errors.dateOfVisit = "Date of Visit Is Required";
    }
    // if (payloadData?.admissionType == "") {
    //   errors.admissionType = "admissionType Is Required";
    // }
    // if (payloadData?.IPDCaseTypeID == "") {
    //   errors.IPDCaseTypeID = "Room Type Is Required";
    // }
    // if (payloadData?.RoomBed == "") {
    //   errors.RoomBed = "Room/Bed Is Required";
    // }
    // if (payloadData?.BillingCategory == "") {
    //   errors.BillingCategory = "Billing Category Is Required";
    // }
    if (payloadData?.Package == "") {
      errors.Package = "Package Is Required";
    }
    if (payloadData?.admissionReason == "") {
      errors.admissionReason = "Admission Reason Is Required";
    }
    return errors;
  };

  const handleBindPanelByPatientID = async (PatientID) => {
    const item = PatientID ? PatientID : data?.patientID;
    try {
      const data = await bindPanelByPatientID(item);
      return data.data;
    } catch (error) {
      console.log(error);
    }
  };

  const handleDoctorDeptWise = async (Department) => {
    try {
      const data = await GetBindDoctorDept(Department);
      return data?.data;
    } catch (error) {
      console.log(error);
    }
  };

  const getBindAdmissionType = async () => {
    try {
      const data = await AdmissionType();
      return data?.data;
    } catch (error) {
      console.error(error);
    }
  };

  const getProNameList = async () => {
    try {
      const response = await BasicMasterBindPro();
      if (response?.success) {
        return response?.data;
      }
    } catch (error) {
      console.error("Error fetching Pro Name List:", error);
    }
  };

  const getPackageList = async () => {
    try {
      const response = await GetIVFPackages();
      if (response?.success) {
        setPackageList(response?.data);
      }
    } catch (error) {
      console.error("Error fetching Pro Name List:", error);
    }
  };

  useEffect(() => {
    getPackageList();
  }, []);
  const getBindRoomType = async () => {
    try {
      const data = await GetIVFRoomType();
      return data?.data;
    } catch (error) {
      console.error(error);
    }
  };

  const getBindRoom = async (params) => {
    const newPayload = {
      caseType: params.caseType,
      isDisIntimated: 0,
      type: "1",
      bookingDate: singlePatientData?.DateEnrolled
        ? singlePatientData?.DateEnrolled
        : params?.bookingDate,
    };

    if (!data) {
      newPayload.TransactionID = 0;
    } else {
      newPayload.TransactionID = Number(
        data?.transactionID ? data?.transactionID : 0,
      );
    }
    try {
      const dataRes = await GetBindRoomBedIVF(newPayload);
      setDropDownState((prevState) => ({
        ...prevState,
        getBindRoomBed: dataRes?.data,
      }));
      setPayloadData((prev) => ({
        ...prev,
        RoomBed: dataRes?.data[0]?.RoomId,
        // BillingCategory: DropDownState?.getBillingCategory?.[0]?.IPDCaseTypeID,
        BillingCategory: DropDownState?.getBillingCategory?.find(
          (item) => Number(item?.value) === Number(BindResource?.IVFRoomTypeId),
        )?.value,
      }));
      if (dataRes?.success) {
        return dataRes?.data;
      } else {
        return [];
      }
    } catch (error) {
      console.error(error);
    }
  };

  const getBindBillingCategory = async () => {
    try {
      const data = await BillingCategory();
      return data?.data;
    } catch (error) {
      console.error(error);
    }
  };

  const commonFetchAllDropDown = async () => {
    try {
      const response = await Promise.all([
        handleBindPanelByPatientID(singlePatientData?.PatientID),
        handleDoctorDeptWise(payloadData?.DepartmentID),
        getBindAdmissionType(),
        getBindRoomType(),
        getBindBillingCategory(),
        getProNameList(),
      ]);

      const responseDropdown = {
        getBindPanelByPatientID: handleReactSelectDropDownOptions(
          response[0],
          "PanelName",
          "PanelID",
        ),
        getDoctorDeptWise: handleReactSelectDropDownOptions(
          response[1],
          "Name",
          "DoctorID",
        ),
        getAdmissionType: handleReactSelectDropDownOptions(
          response[2],
          "ADMISSIONTYPE",
          "ID",
        ),
        getRoomType: handleReactSelectDropDownOptions(
          response[3],
          "Name",
          "IPDCaseTypeID",
        ),
        getBillingCategory: handleReactSelectDropDownOptions(
          response[4],
          "Name",
          "IPDCaseTypeID",
        ),
        getBindProList: handleReactSelectDropDownOptions(
          response[5],
          "ProName",
          "Pro_ID",
        ),
      };

      return responseDropdown;
    } catch (error) {
      console.log(error, "Something Went Wrong");
    }
  };

  const FetchAllDropDown = async () => {
    try {
      const responseDropdown = await commonFetchAllDropDown();
      setDropDownState(responseDropdown);

      setPayloadData({
        ...payloadData,
        panelID: ReactSelectisDefaultValue(
          responseDropdown?.getBindPanelByPatientID,
          "isDefaultPanel",
        ),
      });
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleDataInDetailView = useMemo(() => {
    if (Object.keys(singlePatientData)?.length > 0 && !data) {
      const data = [
        {
          label: t("PatientID"),
          value: `${singlePatientData?.PatientID}`,
        },
        {
          label: t("PatientName"),
          value: `${singlePatientData?.Title} ${singlePatientData?.PName}`,
        },
        {
          label: t("GenderAge"),
          value: `${singlePatientData?.Gender} / ${singlePatientData?.Age}`,
        },
        {
          label: t("ContactNo"),
          value: singlePatientData?.Mobile,
        },
        {
          label: t("Address"),
          value: singlePatientData.House_No,
        },
        {
          label: t("Outstanding"),
          value: singlePatientData?.Outstanding ?? "0.00",
        },
      ];

      return data;
    } else {
      return [];
    }
  }, [singlePatientData, data]);

  const handlePanelReactSelectChange = (name, e) => {
    const data = DropDownState?.getBindPanelByPatientID.find(
      (ele) => Number(ele?.value) === Number(e?.value),
    );

    setPayloadData({
      ...payloadData,
      [name]: data,
    });
  };

  const handleMultiSelectDropDown = (state) => {
    return state?.map((items, _) => {
      return {
        name: items?.Name,
        code: items?.DoctorID,
      };
    });
  };

  const handleReactSelectChange = async (name, e) => {
    switch (name) {
      case "referDoctorID":
        setPayloadData({
          ...payloadData,
          [name]: e?.value,
          referDoctorName: e?.label,
        });
        break;
      case "DepartmentID":
        const data = await handleDoctorDeptWise(e?.label);
        setDropDownState({
          ...DropDownState,
          getDoctorDeptWise: handleMultiSelectDropDown(data),
        });
        setPayloadData({
          ...payloadData,
          [name]: e?.value,
        });
      case "referalTypeID":
        setPayloadData({
          ...payloadData,
          [name]: e,
          referDoctorID: handlereferDocotorIDByReferalType(
            e?.value,
            payloadData?.DoctorID,
            "",
          ),
        });
        break;
      case "DoctorID":
        setPayloadData({
          ...payloadData,
          [name]: e?.value,
          referDoctorID: handlereferDocotorIDByReferalType(
            payloadData?.referalTypeID?.value,
            e?.value,
            payloadData?.referDoctorID,
          ),
        });
        break;

      default:
        setPayloadData({
          ...payloadData,
          [name]: e?.value,
          [`${name}_label`]: e?.label,
        });
        break;
    }
  };

  const handleMultiSelectChange = (name, selectedOptions) => {
    setPayloadData({
      ...payloadData,
      [name]: selectedOptions,
    });
  };

  const handleChange = (e) => {
    const { value, name } = e.target;
    setPayloadData({
      ...payloadData,
      [name]: value,
    });
  };

  const handleReactSelect = async (name, value, secondName) => {
    const obj = { ...payloadData };
    obj[name] = value?.value || "";
    obj[`${name}_label`] = value?.label;

    if (secondName) {
      obj[secondName] = value?.BillingCategoryID || "";
      obj[`${secondName}_label`] = value?.label;
    }
    setPayloadData(obj);
    if (name === "IPDCaseTypeID") {
      const response = await getBindRoom({ caseType: value.value });
      setDropDownState((prevState) => ({
        ...prevState,
        getBindRoomBed: response,
      }));
      setPayloadData((val) => ({
        ...val,
        RoomBed: "",
      }));
    }
  };

  const setIsOpen = () => {
    setHandleModelData((val) => ({ ...val, isOpen: false }));
  };

  const findReferDisable = useCallback(
    (GetReferTypeListData, KeyMatch, valueMatch) => {
      return GetReferTypeListData?.find(
        (ele) => Number(ele[KeyMatch]) === Number(valueMatch),
      );
    },
    [payloadData?.referalTypeID],
  );

  const handleUpdatePatientAdmissionDetails = async () => {
    if (payloadData?.isDischarge) {
      notify(t("You Can Not Edit Admission. Patient is discharged"), "error");
      return 0;
    }
    const customerrors = ErrorHandling();
    if (Object.keys(customerrors)?.length > 0) {
      if (Object.values(customerrors)[0]) {
        notify(Object.values(customerrors)[0], "error");
      }
      return false;
    }
    try {
      // const requestBody = handleUpdateIPDAdmissionPayload(
      //   singlePatientData,
      //   payloadData,
      //   updataDataList,
      //   selectedRelations,
      //   relation,
      // )

      const requestBody = {
        ...handleUpdateIPDAdmissionPayload(
          singlePatientData,
          payloadData,
          updataDataList,
          selectedRelations,
          relation,
        ),
        AdmitDateTime: moment(payloadData?.dateOfVisit)
          .set({
            hour: moment(payloadData?.time).hour(),
            minute: moment(payloadData?.time).minute(),
          })
          .format("YYYY-MM-DD-HH:mm"),
      };

      const response = await UpdatePatientAdmissionDetails(requestBody);
      if (response?.success) {
        notify(response?.message, "success");
        setPayloadData({ ...initialState });
        sendReset();
      } else {
        notify(response?.message, "error");
      }
    } catch (error) {
      console.log(error, "SomeThing Went Wrong");
    }
  };

  const handleSaveIPDAdmission = async () => {
    const customerrors = ErrorHandling();
    if (Object.keys(customerrors)?.length > 0) {
      if (Object.values(customerrors)[0]) {
        notify(Object.values(customerrors)[0], "error");
      }
      return false;
    }
    try {
      // const requestBody = handleSaveIPDAdmissionPayload(
      const requestBody = handleIVFSaveIPDAdmissionPayload(
        SearchPatient?.patientDetail,
        singlePatientData,
        payloadData,
        ip,
        location,
        selectedRelations,
      );
      if (requestBody?.pmh) requestBody.pmh.UniqueHash = uniqueHash || "";
      const response = await handleSaveIVFAdmission(requestBody);
      //   const response = await SaveIPDAdmission(requestBody);

      if (response?.success) {
        notify(response?.message, "success");
        handleConsertFormPrint(response?.data?.transactionID);
        handleIPDAdmissionPrint(response?.data?.transactionID);
        handleFormGPrint(response?.data?.transactionID);
        handleMINISTRYOFHEALTHPrint(response?.data?.transactionID);
        handleIVFCASESHEETPrint(response?.data?.transactionID);
        setPayloadData({ ...initialState });
        sendReset(response?.data?.ipdno);
      } else {
        notify(response?.message, "error");
      }
    } catch (error) { }
  };
  const handleFormGPrint = async (transactionID) => {
    try {
      const reportResp = await handleFormG(String(transactionID));
      if (reportResp?.success) {
        RedirectURL(reportResp?.data?.pdfUrl);
      } else {
        notify(reportResp?.data?.message, "error");
      }
    } catch (error) {
      console.log(error);
    }
  };
  const handleMINISTRYOFHEALTHPrint = async (transactionID) => {
    try {
      const reportResp = await handleMINISTRYOFHEALTH(String(transactionID));
      if (reportResp?.success) {
        RedirectURL(reportResp?.data?.pdfUrl);
      } else {
        notify(reportResp?.data?.message, "error");
      }
    } catch (error) {
      console.log(error);
    }
  };
  const handleIVFCASESHEETPrint = async (transactionID) => {
    try {
      const reportResp = await handleIVFCASESHEET(String(transactionID));
      if (reportResp?.success) {
        RedirectURL(reportResp?.data?.pdfUrl);
      } else {
        notify(reportResp?.data?.message, "error");
      }
    } catch (error) {
      console.log(error);
    }
  };
  const handleIPDAdmissionPrint = async (transactionID) => {
    try {
      const reportResp = await IPDAdmissionReport(Number(transactionID), 2);
      if (reportResp?.success) {
        RedirectURL(reportResp?.data?.pdfUrl);
      } else {
        notify(reportResp?.data?.message, "error");
      }
    } catch (error) {
      console.log(error);
    }
  };
  const handleConsertFormPrint = async (transactionID) => {
    let payload = {
      transactionID: Number(transactionID),
    };
    try {
      const consentForm = await CurrentStockGeneralConsertForm(payload);
      if (consentForm?.success) {
        RedirectURL(consentForm?.data?.pdfUrl);
      } else {
        notify(consentForm?.data?.message, "error");
      }
    } catch (error) {
      console.log(error);
    }
  };
  const GetPatientAdmissionitem = async (data) => {
    try {
      const datas = await GetPatientAdmissionDetails(
        data?.patientID,
        data?.transactionID,
      );
      if (datas?.success) {
        if (
          datas?.data?.admissionDetails?.length > 0 &&
          datas?.data?.doctorList?.length > 0
        ) {
          const responseAdmissionDetails = datas?.data?.admissionDetails[0];
          const responseDoctorList = datas?.data?.doctorList;

          setUpdataDataList(responseAdmissionDetails);

          const bindroomResponse = await getBindRoom({
            caseType: responseAdmissionDetails?.roomTypeID,
            bookingDate: responseAdmissionDetails?.bookingDate,
          });

          const responseDropdown = await commonFetchAllDropDown();

          setDropDownState({
            ...responseDropdown,
            getBindRoomBed: bindroomResponse,
          });

          const doctorIDData = responseDoctorList?.map((items, _) => {
            return {
              name: items?.text,
              code: items?.value,
            };
          });

          setSelectedRelations(datas?.data?.patientrelationList || []);
          setRelationsOnEdit(datas?.data?.patientrelationList || []);
          debugger;
          setPayloadData({
            ...payloadData,
            MLC: responseAdmissionDetails?.mlc,
            admittedBy: responseAdmissionDetails?.admittedBy,
            dateOfVisit: new Date(responseAdmissionDetails?.dateOfAdmit),
            time: parseTimeString(responseAdmissionDetails?.timeOfAdmit),
            admissionType: responseAdmissionDetails?.admission_Type,
            IPDCaseTypeID: responseAdmissionDetails?.roomTypeID,
            RoomBed: responseAdmissionDetails?.roomId,
            BillingCategory: responseAdmissionDetails?.rommType_BillID,
            ReferedSource: responseAdmissionDetails?.source,
            requestedRoomType: responseAdmissionDetails?.requestedRoomType,
            IssuedVisitorCardNo: responseAdmissionDetails?.admissionReason,
            admissionReason: responseAdmissionDetails?.admissionReason,
            treatment: responseAdmissionDetails?.treatment
              ? responseAdmissionDetails?.treatment
              : "",
            diagnosis: responseAdmissionDetails?.diagnosis,
            IPDCaseTypeName: responseAdmissionDetails?.IPDCaseTypeName
              ? responseAdmissionDetails?.IPDCaseTypeName
              : "",
            RoomName: responseAdmissionDetails?.RoomName
              ? responseAdmissionDetails?.RoomName
              : "",
            DoctorID: doctorIDData,
            panelID: responseDropdown?.getBindPanelByPatientID.find(
              (ele) =>
                Number(ele?.value) ===
                Number(responseAdmissionDetails?.panelID),
            ),
          });
        }
      } else {
        setPayloadData((val) => ({ ...val, isDischarge: true }));
        notify(t("You Can Not Edit Admission. Patient is discharged"), "error");
      }
    } catch (error) {
      console.log(error);
    }
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
    }
  };

  const saveProName = async (modalData) => {
    try {
      let payload = {
        proName: modalData?.name,
        ipaddress: ip || "",
      };
      const response = await BasicMasterSavePro(payload);
      if (response?.success) {
        notify(response?.message, "success");
        setIsOpen();
        setModalData({});
        FetchAllDropDown();
      }
    } catch (error) {
      console.error("Error saving Pro Name:", error);
    }
  };

  const saveReferalDoctor = async (modalData) => {
    try {
      let payload = {
        title: modalData?.title?.value,
        doctorName: modalData?.name,
        mobile: modalData?.contactNo,
        address: modalData?.address,
        proID: modalData?.proName?.value,
      };

      const response = await BillingIPDSaveReferDoctor(payload);
      if (response?.success) {
        notify(response?.message, "success");
        setIsOpen();
        setModalData({});
        FetchAllDropDown();
      } else {
        notify(response?.message, "error");
        setIsOpen();
        setModalData({});
      }
    } catch (error) {
      console.error("Error saving Pro Name:", error);
    }
  };

  useEffect(() => {
    dispatch(GetBindReferDoctor());
    dispatch(GetBindReferalType());
    dispatch(GetBindDepartment());
    CentreWiseCacheByCenterIDAPI();
    getProNameList();
  }, []);

  useEffect(() => {
    if (data) {
      GetPatientAdmissionitem(data);
    } else {
      FetchAllDropDown();
    }
  }, [data]);

  let PatientRegistrationArg = {
    PatientID: singlePatientData?.PatientID,
    setVisible: setVisible,
    bindDetailAPI: bindDetailAPI,
    handleBindPanelByPatientID: handleBindPanelByPatientID,
  };

  const getDynamicOptionData = (CommonAPITypeID, ControlName) => {
    let data = [];
    if (ControlName === "MLC") {
      data = MapGeneric_OPTION;
    } else if (ControlName === "treatment") {
      data = filterByTypes(
        DropDownState?.getAdmissionType?.length > 0
          ? DropDownState?.getAdmissionType
          : [],
        ["Treatment"],
        ["AType"],
        "label",
        "label",
        "value",
      );
    }
    return data;
  };

  const handleCustomReactSelect = (name, value) => {
    handleReactSelectChange(name, value);
  };

  const handleCustomChange = (e, Type, ControlName) => {
    if (Type === "text") {
      return handleChange(e);
    } else if (Type === "number") {
      return inputBoxValidation(MOBILE_NUMBER_VALIDATION_REGX, e, handleChange);
    }
  };
  console.log(DropDownState?.getBillingCategory, "aaaaaaaaaaaaaaaaa")
  useEffect(() => {
    if (!payloadData?.IPDCaseTypeID) {
      setPayloadData((val) => ({
        ...val,
        RoomBed: "",
      }));
    }
  }, [payloadData?.IPDCaseTypeID]);

  const dynamicForm = useMemo(() => {
    return (
      <DynamicForm
        dynamicData={PageConfigurationAPIList?.filter(
          (ele) => ele?.IsActive === 1 && ele?.URLID === 12,
        )}
        values={payloadData}
        handleCustomChange={handleCustomChange}
        // handleKeyDownFun={handleKeyDownFun}
        handleCustomReactSelect={handleCustomReactSelect}
        getDynamicOptionData={getDynamicOptionData}
        // handleAddNewData={handleAddNewData}
        t={t}
        setValues={setPayloadData}
      />
    );
  }, [
    PageConfigurationAPIList,
    DropDownState?.getAdmissionType,
    MapGeneric_OPTION,
    payloadData,
  ]);

  return (
    <>
      {handleModelData?.isOpen && (
        <Modal
          visible={handleModelData?.isOpen}
          setVisible={setIsOpen}
          modalWidth={handleModelData?.width}
          Header={t(handleModelData?.label)}
          buttonType={"submit"}
          buttons={handleModelData?.extrabutton}
          buttonName={handleModelData?.buttonName}
          modalData={modalData}
          setModalData={setModalData}
          footer={handleModelData?.footer}
          handleAPI={handleModelData?.handleInsertAPI}
        >
          {handleModelData?.Component}
        </Modal>
      )}
      <DetailsCardForDefaultValue
        singlePatientData={handleDataInDetailView}
        PatientRegistrationArg={PatientRegistrationArg}
        ModalComponent={ModalComponent}
        isElipsis={data}
        sendReset={() => {
          setPayloadData({
            panelID: "",
            referalTypeID: {
              label: "Self",
              value: 4,
            },
            referDoctorID: "",
            DepartmentID: "ALL",
            DoctorID: "",
            proId: "",
            dateOfVisit: new Date(),
            time: new Date(),
            admissionType: "",
            IPDCaseTypeID: "",
            BillingCategory: "",
            RoomBed: "",
            ReferedSource: "",
            requestedRoomType: "",
            IssuedVisitorCardNo: "",
            admissionReason: "",
          });
          sendReset();
        }}
        show={data}
      >
        <>
          <ReactSelect
            placeholderName={t("InSurancePanel")}
            id={"InSurancePanel"}
            searchable={true}
            respclass="col-xl-2 col-md-4 col-sm-6 col-12"
            value={payloadData?.panelID?.value}
            name={"panelID"}
            dynamicOptions={DropDownState?.getBindPanelByPatientID}
            isDisabled={data ? true : false}
            handleChange={handlePanelReactSelectChange}
            removeIsClearable={true}
          />
          <ReactSelect
            placeholderName={t("refertype")}
            id={"refertype"}
            searchable={true}
            respclass="col-xl-2 col-md-4 col-sm-6 col-12"
            dynamicOptions={handleReactSelectDropDownOptions(
              GetReferTypeList,
              "ReferalType",
              "ReferalTypeID",
            )}
            name={"referalTypeID"}
            value={payloadData?.referalTypeID?.value}
            handleChange={handleReactSelectChange}
            removeIsClearable={true}
          />
          <div className="d-flex col-xl-2 col-md-4 col-sm-6 col-12">
            <ReactSelect
              placeholderName={t("referDoctor")}
              id={"referDoctor"}
              searchable={true}
              respclass="col-xl-10 col-md-10 col-sm-10 pl-0"
              dynamicOptions={
                Number(
                  findReferDisable(
                    GetReferTypeList,
                    "ReferalTypeID",
                    payloadData?.referalTypeID?.value,
                  )?.IsMainDoctor,
                ) === 0
                  ? handleReactSelectDropDownOptions(
                    GetBindReferDoctorList,
                    "NAME",
                    "DoctorID",
                  )
                  : [...DropDownState?.getDoctorDeptWise]
              }
              name="referDoctorID"
              value={payloadData?.referDoctorID}
              handleChange={handleReactSelectChange}
            />

            <div>
              <button
                className="btn btn-sm btn-primary"
                onClick={() => {
                  setHandleModelData({
                    label: t("Add Refer Doctor"),
                    buttonName: t(""),
                    width: "30vw",
                    isOpen: true,
                    Component: (
                      <ReferDoctorModal
                        isProName={false}
                        setModalData={setModalData}
                        DropDownState={DropDownState}
                      />
                    ),
                    handleInsertAPI: saveReferalDoctor,
                  });
                }}
                type="button"
              >
                <i className="fa fa-plus-circle fa-sm new_record_pluse "></i>
              </button>
            </div>
          </div>
          <div className="d-flex col-xl-2 col-md-4 col-sm-6 col-12">
            <ReactSelect
              placeholderName={t("PRO")}
              id={"PRO"}
              searchable={true}
              name={"proId"}
              respclass="col-xl-10 col-md-10 col-sm-10 pl-0"
              dynamicOptions={DropDownState?.getBindProList}
              value={payloadData?.proId}
              handleChange={handleReactSelectChange}
            />

            <div>
              <button
                className="btn btn-sm btn-primary"
                onClick={() => {
                  setHandleModelData({
                    label: t("Add Refer Doctor"),
                    buttonName: t(""),
                    width: "30vw",
                    isOpen: true,
                    Component: (
                      <ReferDoctorModal
                        isProName={true}
                        setModalData={setModalData}
                      />
                    ),
                    handleInsertAPI: saveProName,
                  });
                }}
                type="button"
              >
                <i className="fa fa-plus-circle fa-sm new_record_pluse "></i>
              </button>
            </div>
          </div>

          <ReactSelect
            placeholderName={t("department")}
            id={"department"}
            searchable={true}
            respclass="col-xl-2 col-md-4 col-sm-6 col-12"
            dynamicOptions={[
              { label: t("All"), value: "ALL" },
              ...handleReactSelectDropDownOptions(
                GetDepartmentList,
                "Name",
                "ID",
              ),
            ]}
            name="DepartmentID"
            value={payloadData?.DepartmentID}
            handleChange={handleReactSelectChange}
            // isDisabled={UHID ? true : false}
            removeIsClearable={true}
          />

          <MultiSelectComp
            respclass="col-xl-2 col-md-4 col-sm-6 col-12"
            name="DoctorID"
            id="DoctorID"
            placeholderName={t(" Consulting Doctor ")}
            dynamicOptions={DropDownState?.getDoctorDeptWise?.map((ele) => ({
              code: ele?.code || ele?.DoctorID,
              name: ele?.name || ele?.Name,
            }))}
            handleChange={handleMultiSelectChange}
            value={payloadData?.DoctorID}
            requiredClassName={`required-fields ${errors?.DoctorID ? "required-fields-active" : ""}`}
          />

          {payloadData?.DoctorID?.length > 0 && (
            <div className="col-12">
              <div className="doctorBind">
                <div className="doctorsName">
                  {payloadData?.DoctorID?.map((item) => {
                    return item?.name;
                  }).join("  ,  ")}
                </div>
              </div>
            </div>
          )}
        </>
      </DetailsCardForDefaultValue>
      <div className="row px-2">
        <Input
          type="text"
          className="form-control"
          id="diagnosis"
          name="diagnosis"
          value={payloadData?.diagnosis}
          onChange={handleChange}
          lable={t("Diagnosis")}
          placeholder=""
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
        />

        <div className="col-xl-2 col-md-4 col-sm-6 col-12 d-flex">
          <DatePicker
            className={`custom-calendar `}
            respclass="vital-sign-date"
            id="dateOfVisit"
            name="dateOfVisit"
            value={
              payloadData?.dateOfVisit
                ? moment(payloadData?.dateOfVisit).toDate()
                : ""
            }
            minDate={yesterday}
            maxDate={new Date()}
            handleChange={(e) => {
              const dateInput = e.target.value;

              setPayloadData((prev) => ({
                ...prev,
                dateOfVisit: moment(dateInput).toDate(), // Ensure state updates
              }));
            }}
            lable={t("Admission Date")}
            placeholder={VITE_DATE_FORMAT}
            inputClassName={"required-fields"}
            disable={!data ? false : true}
          />

          <TimePicker
            lable={t("Time")}
            respclass="vital-sign-time ml-1"
            id="time"
            name="time"
            value={payloadData?.time}
            handleChange={handleChange}
            className={"required-fields"}
          />
        </div>
        <div className="d-none">
          <ReactSelect
            placeholderName={t("Admission_Type")}
            id={"admissionType"}
            name="admissionType"
            value={payloadData?.admissionType}
            handleChange={handleReactSelectChange}
            dynamicOptions={filterByTypes(
              DropDownState?.getAdmissionType?.length > 0
                ? DropDownState?.getAdmissionType
                : [],
              ["AdmissionType"],
              ["AType"],
              "label",
              "label",
              "value",
            )}
            searchable={true}
            respclass="col-xl-2 col-md-4 col-sm-6 col-12"
            requiredClassName={`required-fields ${errors?.admissionType ? "required-fields-active" : ""}`}
          />

          <ReactSelect
            placeholderName={t("Room_Type")}
            id={"IPDCaseTypeID"}
            name="IPDCaseTypeID"
            value={payloadData?.IPDCaseTypeID}
            handleChange={(name, e) =>
              handleReactSelect(name, e, "IPDCaseTypeID")
            }
            dynamicOptions={handleReactSelectDropDownOptions(
              DropDownState?.getRoomType ? DropDownState?.getRoomType : "",
              "Name",
              "IPDCaseTypeID",
            )}
            isDisabled={data ? true : false}
            searchable={true}
            respclass="col-xl-2 col-md-4 col-sm-6 col-12"
            requiredClassName={`required-fields ${errors?.IPDCaseTypeID ? "required-fields-active" : ""}`}
          />

          <ReactSelect
            placeholderName={t("Room_BedNo")}
            id={"RoomBed"}
            searchable={true}
            respclass="col-xl-2 col-md-4 col-sm-6 col-12"
            name="RoomBed"
            dynamicOptions={DropDownState?.getBindRoomBed?.map((item) => ({
              label: item?.Name,
              value: item?.RoomId,
            }))}
            isDisabled={data ? true : false}
            value={payloadData?.RoomBed}
            handleChange={handleReactSelectChange}
            requiredClassName={`required-fields ${errors?.RoomBed ? "required-fields-active" : ""}`}
          />
          <ReactSelect
            placeholderName={t("Billing_Category")}
            id={"BillingCategory"}
            searchable={true}
            respclass="col-xl-2 col-md-4 col-sm-6 col-12"
            name="BillingCategory"
            dynamicOptions={DropDownState?.getBillingCategory?.map((item) => ({
              label: item?.Name,
              value: item?.IPDCaseTypeID,
            }))}
            isDisabled={data ? true : false}
            value={payloadData?.BillingCategory}
            handleChange={handleReactSelect}
            requiredClassName={`required-fields ${errors?.BillingCategory ? "required-fields-active" : ""}`}
          />
        </div>

        <ReactSelect
          placeholderName={t("Refered Source")}
          id={"ReferedSource"}
          searchable={true}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
          name="ReferedSource"
          dynamicOptions={translateOptions(ReferedSourceConst, t)}
          value={payloadData?.ReferedSource}
          handleChange={handleReactSelectChange}
        />

        <ReactSelect
          placeholderName={t("Requested_Room_Type")}
          id={"requestedRoomType"}
          name="requestedRoomType"
          value={payloadData?.requestedRoomType}
          handleChange={handleReactSelectChange}
          dynamicOptions={DropDownState?.getRoomType?.map((item) => ({
            label: item?.Name,
            value: item?.IPDCaseTypeID,
          }))}
          searchable={true}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
        />

        {dynamicForm}
        {singlePatientData?.PatientRelationData?.length > 0 && (
          <>
            {relationCheckList?.map((rel, index) => {
              return (
                <LabelInputBox
                  isChecked={selectedRelations?.includes(rel)}
                  style={{ cursor: "pointer" }}
                  className={"col-xl-4 col-md-4 col-sm-6 col-12"}
                  label={`Relation_${index + 1}`}
                  value={rel.RelationName}
                  relation={rel.RelationOf}
                  recontactNo={rel.RelationPhoneNo}
                  setCheclBoxValue={(name, isChecked) => {
                    if (isChecked) {
                      setSelectedRelations((prev) => [...prev, rel]);
                    } else {
                      setSelectedRelations(() =>
                        selectedRelations.filter((item) => item !== rel),
                      );
                    }
                  }}
                />
              );
            })}
          </>
        )}
        <ReactSelect
          placeholderName={t("Package")}
          id={"Package"}
          name="Package"
          value={payloadData?.Package}
          handleChange={handleReactSelectChange}
          dynamicOptions={packageList?.map((item) => ({
            label: item?.PackageName,
            value: item?.PackageID,
          }))}
          searchable={true}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
        />
        <Input
          type="text"
          className="form-control required-fields"
          id="admissionReason"
          name="admissionReason"
          value={payloadData?.admissionReason}
          onChange={handleChange}
          lable={t("Admission Reason")}
          placeholder=""
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
        />


      </div>
      <div className="d-flex justify-content-end">
        {data ? (
          <button className="btn btn-primary btn-sm px-3 mr-2" onClick={handleUpdatePatientAdmissionDetails}
            disabled={payloadData?.isDischarge}
          >
            {t("Update")}
          </button>
        ) : (
          <button
            className="btn btn-primary btn-sm px-3 mr-2"
            onClick={handleSaveIPDAdmission}
          >
            {t("Save")}
          </button>
        )}
      </div>
    </>
  );
};

export default IvfIPDDetailCard;
