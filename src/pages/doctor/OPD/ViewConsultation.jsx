import React, { useEffect, useState } from "react";
import { ensureServiceApproved } from "../../../utils/serviceApprovalGuard";
import Heading from "../../../components/UI/Heading";
import { useTranslation } from "react-i18next";
import ReactSelect from "../../../components/formComponent/ReactSelect";
import Input from "@app/components/formComponent/Input";
import DatePicker from "../../../components/formComponent/DatePicker";
import AppointmentPatientDetail from "../../../components/UI/customTable/doctorTable/ViewConsultationtable/AppointmentPatientDetail";
import Tables from "../../../components/UI/customTable";
import {
  GetBindAllDoctorConfirmation,
  GetBindDepartment,
} from "../../../store/reducers/common/CommonExportFunction";
import { useDispatch, useSelector } from "react-redux";
import { useLocalStorage } from "../../../utils/hooks/useLocalStorage";
import { useFormik } from "formik";
import {
  AUTOCOMPLETE_STATE,
  ViewConsultationPayload,
  VIEWSTATUS,
} from "../../../utils/constant";

import moment from "moment";
import {
  CommonAPIGetDoctorIDByEmployeeID,
  GetBindDoctorPrescriptionSuggestion,
  getDoctorNotes,
  getGetDoctor,
  getGetMolecular,
  getGetSignAndSymptoms,
  getListBindMenu,
  GetPatientMedicalInfo,
  getProcedureItemSearch,
  getVaccinationStatus,
  LoadInvestigation,
  SearchChiefComplaintTemplate,
  SearchDietTemplate,
  SearchDoctorAdvoice,
  SearchGeneralExamination,
  SearchList,
  SearchPastHistory,
  SearchPersonalHistory,
  SearchPrescribeMedicine,
  SearchProvisionalDiagnosis,
  SearchTreatmentHistory,
  SystematicExamination,
  UpdateCall,
  UpdateIn,
  UpdateUncall,
} from "../../../networkServices/DoctorApi";
import { filterByTypes, notify } from "../../../utils/utils";
import audioFile from "../../../assets/Audio/notification.mp3";
import audioFileOut from "../../../assets/Audio/notifyOut.mp3";
import { SearchListData } from "../../../store/reducers/DoctorModule/VitalSign";
import ColorCodingSearch from "../../../components/commonComponents/ColorCodingSearch";
import { getNursingWardCrossConsultationsApi } from "../../../networkServices/nursingWardAPI";
import Modal from "../../../components/modalComponent/Modal";
import MedicationCalendar from "../../../components/modalComponent/Utils/MedicationCalendar";
import FlowsheetModel from "../../../components/modalComponent/Utils/FlowsheetModel";
import PatientSummaryCalendar from "../../../components/modalComponent/Utils/PatientSummaryCalendar";
// The two appointment lists use the modern table look (AppointmentModernTables); the
// classic PendingAppointmentPatientList / DoneAppointmentDetail components stay in the
// project for other screens.
import {
  PendingAppointmentsModern,
  DoneAppointmentsModern,
} from "../../../components/UI/customTable/doctorTable/ViewConsultationtable/AppointmentModernTables";
import { translateOptions } from "@components/WrapTranslate";

const ViewConsultation = () => {
  const [items, setItems] = useState(AUTOCOMPLETE_STATE);

  const [currentDoctor, setCurrentDoctor] = useState({
    label: "Loading...",
    value: "0",
  });

  const { VITE_DATE_FORMAT } = import.meta.env;
  const [t] = useTranslation();
  const localData = useLocalStorage("userData", "get");
  const dispatch = useDispatch();
  const [active, setActive] = useState(true);
  const [calledPatient, setCalledPatient] = useState("UnCall");
  const [crossConsultationData, setCrossConsultationData] = useState([]);
  const [getCall, setCall] = useState();
  const [medicalData, setMedicalInfoData] = useState(null);
  const [docID, setDocID] = useState();
  const [showFlowSheet, setShowFlowSheet] = useState(false);
  const [showMedicationCalendar, setShowMedicationCalendar] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [bodyData, setBodyData] = useState({
    SearchViewConsultaionList: [],
    DoneAppointmentListList: [],
  });

  let audio = new Audio(audioFile);
  let audioFileP = new Audio(audioFileOut);

  const handleStartAudioPatientComing = (params) => {
    if (params.IsCall === 1) {
      audioFileP.play();
    } else {
      audio.play();
    }
  };
  const { GetDepartmentList, GetBindAllDoctorConfirmationData } = useSelector(
    (state) => state.CommonSlice,
  );
  const { handleChange, values, setFieldValue, handleSubmit, resetForm } = useFormik({
    initialValues: {
      mrNo: "",
      pName: "",
      appNo: "",
      doctorID: currentDoctor,
      status: "2",
      fromDate: moment().format("DD-MMM-YYYY"),
      toDate: moment().format("DD-MMM-YYYY"),
      docDepartment: { label: "All", value: "0" },
      appStatus: "0",
    },
    onSubmit: async (values, { resetForm }) => {
      SearchOPDBillsCallAPI();
    },
  });

  const newValues = {
    mrNo: values?.mrNo,
    pName: values?.pName,
    appNo: values?.appNo,
    docDepartment: values?.docDepartment ? values?.docDepartment?.value : "",
    doctorID: values?.doctorID ? values?.doctorID?.value : "",
    status: values?.status?.value ? values?.status?.value : values.status,
    // fromDate: "01-Aug-2024",
    // fromDate: moment(values?.fromDate).format("DD-MMM-YYYY"),
    // toDate: moment(values?.toDate).format("DD-MMM-YYYY"),
    fromDate: values?.fromDate
      ? moment(values.fromDate, "DD-MMM-YYYY", true).format("DD-MMM-YYYY")
      : "",

    toDate: values?.toDate
      ? moment(values.toDate, "DD-MMM-YYYY", true).format("DD-MMM-YYYY")
      : "",
  };
  const SearchOPDBillsCallAPI = async () => {
    try {
      // debugger
      const dataRes = await SearchList(newValues);
      if (dataRes?.success) {
        setBodyData((prevState) => ({
          ...prevState,
          SearchViewConsultaionList: dataRes?.data?.pendingAppointmentList,
          DoneAppointmentListList: dataRes?.data?.viewedAppointmentList,
        }));
      } else {
        notify(dataRes?.message, "error");
        setBodyData({
          SearchViewConsultaionList: [],
          DoneAppointmentListList: [],
        });
      }
    } catch (error) {
      console.error(error);
    }
  };
  console.log(bodyData, "bodyDataaaaaaaaaaaaaaaaaaaaa");
  const getUpdateCallAPI = async (items, index, listType) => {
    // debugger;
    const newValues = {
      app_ID: items?.App_ID,
      doctorID: items?.DoctorID,
    };

    try {
      const dataRes = await UpdateCall(newValues);

      if (dataRes.success) {
        // SRS-2026-0057 point 1. Call keeps marking the patient In and opening
        // the consultation in the same click - confirmed as the intended
        // workflow. The restored In column is therefore a re-entry action: it
        // lets the doctor get back into an already-called patient without
        // having to UnCall and Call again (which would wipe CallNo/IsCall/P_In
        // and re-queue them).
        notify(dataRes.message, "success");
        handlePatientSelect(items, index, listType);
        try {
          const medInfoRes = await GetPatientMedicalInfo(items?.PatientID);
          if (medInfoRes?.success) {
            setMedicalInfoData(medInfoRes?.data);
          }
          /* else{
            notify(medInfoRes?.message,"error")
          } */
        } catch (error) {
          notify(error?.message, "error");
        }
      } else {
        notify(dataRes.message, "error");
      }
      SearchOPDBillsCallAPI();
    } catch (error) {
      console.error(error);
    }
  };

  const getUpdateUncall = async (items) => {
    try {
      const response = await UpdateUncall(items?.App_ID);

      // if (response.success) {
      //   notify(response.message, "success");
      // }
      // Refused by the API, e.g. the patient was called by another doctor.
      if (response && response.success === false && response.message) {
        notify(response.message, "error");
      }

      SearchOPDBillsCallAPI();
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const getUpdateInAPI = async (item, index, listType) => {
    let finalItem = item;
    let finalIndex = index;
    let finalListType = listType;

    // Ensure we have the full item data
    if (
      !finalItem?.TransactionID ||
      finalIndex === undefined ||
      finalListType === undefined
    ) {
      const pendingIndex = bodyData?.SearchViewConsultaionList?.findIndex(
        (i) => i.App_ID === item.App_ID,
      );
      if (pendingIndex !== -1) {
        finalItem = bodyData.SearchViewConsultaionList[pendingIndex];
        finalIndex = pendingIndex;
        finalListType = "Pending";
      } else {
        const doneIndex = bodyData?.DoneAppointmentListList?.findIndex(
          (i) => i.App_ID === item.App_ID,
        );
        if (doneIndex !== -1) {
          finalItem = bodyData.DoneAppointmentListList[doneIndex];
          finalIndex = doneIndex;
          finalListType = "Done";
        }
      }
    }

    const newValues = {
      app_ID: finalItem?.App_ID,
      doctorID: finalItem?.DoctorID,
    };

    try {
      const dataRes = await UpdateIn(newValues);
      if (dataRes?.success) {
        setGetUser(finalItem);
        setDocID(finalItem?.DoctorID);
        // notify(dataRes?.message, "success");
        SearchOPDBillsCallAPI();
        setSelectedIndex({ index: finalIndex, listType: finalListType });
        setActive(false);
        setShowNotesModal(false);
      } else {
        notify(dataRes?.message, "error");
      }

      // setBodyData((prevState) => {
      //   const updatedList =
      //     prevState.SearchViewConsultaionList.pendingAppointmentList.map(
      //       (val, i) => (i === index ? { ...val, IsCall: 1 } : val)
      //     ) && prevState.SearchViewConsultaionList.viewedAppointmentList          .map(
      //       (val, i) => (i === index ? { ...val, IsCall: 1 } : val)
      //     )
      //   return {
      //     ...prevState,
      //     SearchViewConsultaionList: {
      //       ...prevState.SearchViewConsultaionList, pendingAppointmentList: updatedList,
      //     },
      //   };
      // });
    } catch (error) {
      console.error(error);
    }
  };

  // const getUpdateInAPI = async (item, index,listType) => {
  //   const newValues = {
  //     app_ID: `${item?.App_ID}`,
  //     doctorID: item?.DoctorID,
  //   };

  //   try {
  //     const dataRes = await UpdateIn(newValues);

  //     setBodyData((prevState) => {
  //       const updatedList =
  //         prevState.SearchViewConsultaionList.pendingAppointmentList.map(
  //           (val, i) => (i === index ? { ...val, IsCall: 1 } : val)
  //         ) && prevState.SearchViewConsultaionList.viewedAppointmentList          .map(
  //           (val, i) => (i === index ? { ...val, IsCall: 1 } : val)
  //         )
  //       return {
  //         ...prevState,
  //         SearchViewConsultaionList: {
  //           ...prevState.SearchViewConsultaionList, pendingAppointmentList: updatedList,
  //         },
  //       };
  //     });
  //   } catch (error) {
  //     console.error(error);
  //   }
  // };

  const handleReactSelectChange = async (name, e) => {
    setFieldValue(name, e);
    switch (name) {
      case "DepartmentID":
        dispatch(
          GetBindAllDoctorConfirmation({
            Department: e.label,
            CentreID: localData?.centreID,
          }),
        );
        break;
      default:
        break;
    }
  };

  // "Invite Patient" and "RPM" columns: shown only when fin_global_resources
  // IsShowInvitePatientColumn / IsShowRPMColumn has Value = 1 (no row = column removed).
  const { GetGlobalResources } = useSelector((state) => state.CommonSlice);
  const isGlobalFlagOn = (name) =>
    Array.isArray(GetGlobalResources) &&
    String(GetGlobalResources.find((item) => item?.Name === name)?.Value) === "1";
  const showInvitePatientColumn = isGlobalFlagOn("IsShowInvitePatientColumn");
  const showRPMColumn = isGlobalFlagOn("IsShowRPMColumn");

  const SearchThead = [
    { name: t("Sr.No"), width: "2%" },
    { name: t("FlowSheet"), width: "7%" },
    ...(showInvitePatientColumn ? [{ name: t("Invite Patient"), width: "46%" }] : []),
    ...(showRPMColumn ? [{ name: t("RPM"), width: "10%" }] : []),
    { name: t("Call"), width: "2%" },
    { name: t("UHID"), width: "10%" },
    { name: t("Token No"), width: "10%" },
    { name: t("Visit No"), width: "10%" },
    { name: t("Name"), width: "46%" },
    // t("Name"),

    { name: t("Age/Gender"), width: "10%" },
    { name: t("Doctor"), width: "20%" },
    { name: t("Reg Date"), width: "46%" },
    { name: t("App Date"), width: "46%" },
    { name: t("Call Date"), width: "46%" },
    { name: t("Start Date"), width: "46%" },
    { name: t("End Date"), width: "46%" },

    // { name: t("AppDate"), width: "10%" },
    // t("Appointment Time"),
    // t("Appointment No"),
    // t("Panel"),

    // SRS-2026-0057 point 1. The In column was commented out here, in the row
    // cell, and in the handlePatientSelect prop below, which left a called
    // patient with no way to be marked In. Must stay last - the table renders
    // body columns in object-key order and P_In is the last key on the row.
    { name: t("In"), width: "2%" },
  ];

  const tHead = [
    { name: t("Sr.No"), width: "2%" },
    { name: t("UHID"), width: "10%" },
    { name: t("Name"), width: "46%" },
    { name: t("Age/Gender"), width: "10%" },
    { name: t("Doctor"), width: "20%" },
    { name: t("Date"), width: "10%" },
    ...(showRPMColumn ? [{ name: t("RPM"), width: "10%" }] : []),

    // t("Appointment Date"),
    // t("Appointment Time"),
    // t("Appointment No"),
    // t("Panel"),
    // t("Call"),
    { name: t("In"), width: "2%" },
  ];

  const handleReactSelect = (name, value) => {
    setFieldValue(name, value);
  };

  const [selectedIndex, setSelectedIndex] = useState({
    index: null,
    listType: null,
  });

  const [getDoctorID, setDoctorID] = useState(null);
  const [docterError, setDoctorError] = useState();
  const [getUser, setGetUser] = useState({});

  const handlePatientSelect = async (item, index, listType) => {
    // SRS-2026-0056 point 14. Do not open the consultation for a patient whose service is
    // neither paid in full nor approved. Only enforced when fin_global_resources
    // 'ServiceApprovalRequired' = '1'.
    const approved = await ensureServiceApproved({
      patientID: item?.UHID ?? item?.PatientID,
      transactionID: item?.TransactionID,
    });
    if (!approved) return;

    setGetUser(item);
    setDocID(item?.DoctorID);

    // SRS-2026-0057 point 1. A patient who is already In just needs the
    // consultation reopened. Calling UpdateIn again would re-stamp InTime and
    // lose the real start of the consultation, so skip the API and open.
    if (Number(item?.P_In) === 1) {
      setSelectedIndex({ index, listType });
      setActive(false);
      setShowNotesModal(false);
      return;
    }

    // debugger
    await getUpdateInAPI(item, index, listType);

    // await fetchAllApiData(item)
  };

  const checkGetDoctorIDForTransationID = async (item, index) => {
    try {
      const response = await getGetDoctor(item?.TransactionID);
      if (response.success) {
        setDoctorID(response.data);
        item.DoctorID = response.data;
        fetchAllApiData(item);
      } else if (response.success === false) {
        fetchAllApiData(item);
        const doctorIDFromBodyData = getUser?.DoctorID;
        setDoctorID(doctorIDFromBodyData);
      }

      if (response.success === false) {
        setDoctorError(1);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (getUser?.TransactionID) {
      checkGetDoctorIDForTransationID(getUser);
    }
  }, [getUser?.TransactionID]);

  const handleCallButtonClick = (items, index, listType) => {
    setDocID(items?.DoctorID);
    setGetUser(items);
    if (items.IsCall === 1) {
      handleStartAudioPatientComing(items);
      getUpdateUncall(items);
      dispatch(SearchListData(newValues));
    } else {
      handleStartAudioPatientComing(items);
      getUpdateCallAPI(items, index, listType);
      dispatch(SearchListData(newValues));
    }
  };
  useEffect(() => {
    dispatch(
      GetBindAllDoctorConfirmation({
        Department: "All",
        CentreID: localData?.centreID,
      }),
    );
    dispatch(GetBindDepartment());
  }, [dispatch]);

  const handleSearchChiefComplaintTemplate = async (doctorID) => {
    try {
      const response = await SearchChiefComplaintTemplate(doctorID);
      return response?.data;
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleSearchPastHistory = async (doctorID) => {
    try {
      const response = await SearchPastHistory(doctorID);
      return response?.data;
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleSearchTreatmentHistory = async (doctorID) => {
    try {
      const response = await SearchTreatmentHistory(doctorID);
      return response?.data;
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleSearchPersonalHistory = async (doctorID) => {
    try {
      const response = await SearchPersonalHistory(doctorID);
      return response?.data;
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleSearchGeneralExamination = async (doctorID) => {
    try {
      const response = await SearchGeneralExamination(doctorID);
      return response?.data;
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleSystematicExamination = async (doctorID) => {
    try {
      const response = await SystematicExamination(doctorID);
      return response?.data;
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleSearchProvisionalDiagnosis = async (doctorID) => {
    try {
      const response = await SearchProvisionalDiagnosis(doctorID);
      return response?.data;
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleSearchDoctorAdvoice = async (doctorID) => {
    try {
      const response = await SearchDoctorAdvoice(doctorID);
      return response?.data;
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleLoadInvestigation = async (serachInvestigationPayload) => {
    try {
      const response = await LoadInvestigation(serachInvestigationPayload);
      if (!response?.success) {
        notify("LoadInvestigation API failed" ?? response?.message, "Warning");
        return [];
      }
      const data = Array.isArray(response?.data) ? response?.data : [];
      const nameChangeResponse = data?.map((ele) => {
        return {
          ID: ele?.newItemID,
          ValueField: ele?.typeName,
          value: ele?.itemID,
          TemplateName: ele?.typeName,
          AllItemData: ele?.newItemID,
          subCategoryID: ele?.subCategoryID,
          categoryID: ele?.categoryid,
          /* Display only. PrescriptionAdvice/LoadInvestigation already LEFT JOINs
             f_ratelist for this visit's panel, centre and schedule charge - the rate
             a CASH patient is shown is the CASH rate - and returns it as Rate. It was
             simply being dropped here. Nothing prices anything off this: the bill is
             still raised by the front office from its own rate lookup. */
          rate: Number(ele?.rate ?? ele?.Rate ?? 0),
        };
      });
      return nameChangeResponse;
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleGetCrossConsultation = async () => {
    try {
      const response = await getNursingWardCrossConsultationsApi(
        getUser?.TransactionID,
      );
      if (response?.success) {
        setCrossConsultationData(response?.data);
      } else {
        notify(response?.message, "error");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleSearchPrescribeMedicine = async (doctorID) => {
    try {
      const response = await SearchPrescribeMedicine(doctorID);
      const nameChangeResponse = response?.data?.map((ele) => {
        return {
          ID: ele?.id,
          ValueField: ele?.valueField.map((item, index) => {
            return {
              TemplateID: ele?.id,
              Name: {
                value: item?.name,
                ID: item?.itemID,
                isDisable: true,
                AllItemData: ele,
              },
              Dose: {
                value: item?.dose,
              },
              Time: {
                value: item?.times,
              },
              Duration: {
                value: item?.duration,
              },
              Route: {
                value: item?.route,
              },
              Meal: {
                value: item?.meal,
              },
              Remarks: {
                value: item?.remarks,
              },
              AllItemListData: {
                value: ele,
              },
            };
          }),
          TemplateName: ele?.tempName,
          templateFor: ele?.templateFor,
          // AllItemData:ele
        };
      });
      setItems((val) => ({
        ...val,
        ["Prescribed Medicine"]: nameChangeResponse,
      }));
      return nameChangeResponse;
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleSearchDietTemplate = async (doctorID) => {
    try {
      const response = await SearchDietTemplate(doctorID);
      return response?.data;
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };
  const handleGetDoctorNotes = async (doctorID) => {
    try {
      const response = await getDoctorNotes(doctorID);
      return response?.data;
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };
  const handlegetProcedureItemSearch = async (doctorID) => {
    try {
      const response = await getProcedureItemSearch();
      const nameChangeResponse = response?.data?.map((ele) => {
        return {
          ID: ele?.NewItemID,
          ValueField: ele?.TypeName,
          value: ele?.NewItemID,
          TemplateName: ele?.TypeName,
          AllItemData: ele,
        };
      });

      return nameChangeResponse;
      // return response?.data;
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };
  const handlegetgetGetSignAndSymptoms = async (doctorID) => {
    try {
      const response = await getGetSignAndSymptoms(doctorID);
      return response?.data;
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };
  const handlegetVaccinationStatus = async (doctorID) => {
    try {
      const response = await getVaccinationStatus(doctorID);
      return response?.data;
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };
  const dataBindSuggetion = async (doctorID) => {
    try {
      const response = await GetBindDoctorPrescriptionSuggestion({
        doctorId: doctorID,
      });
      return response?.data;
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handlegetgetGetMolecular = async (doctorID) => {
    try {
      const response = await getGetMolecular();
      return response?.data;
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const fetchAllApiData = async (details) => {
    const serachInvestigationPayload = {
      type: "1",
      categoryID: "0",
      subCategoryID: "0",
      isIPDData: Number(0),
      transactionId: String(details?.TransactionID),
      appID: String(details?.App_ID),
    };
    const response = await Promise.all([
      await handleSearchChiefComplaintTemplate(details?.DoctorID),
      await handleSearchPastHistory(details?.DoctorID),
      await handleSearchTreatmentHistory(details?.DoctorID),
      await handleSearchPersonalHistory(details?.DoctorID),
      await handleSearchGeneralExamination(details?.DoctorID),
      //  await  handleSystematicExamination(payload),
      await handleSearchProvisionalDiagnosis(details?.DoctorID),
      await handleSearchDoctorAdvoice(details?.DoctorID),
      await handleSearchDietTemplate(details?.DoctorID),
      await handleLoadInvestigation(serachInvestigationPayload),
      await handleSearchPrescribeMedicine(details?.DoctorID),
      await handleGetDoctorNotes(details?.DoctorID),
      await handlegetProcedureItemSearch(),
      await handlegetgetGetSignAndSymptoms(details?.DoctorID),
      await handlegetVaccinationStatus(details?.DoctorID),
      // await dataBindSuggetion(details?.DoctorID),
      // await handlegetgetGetMolecular(),
    ]);

    const setData = { ...AUTOCOMPLETE_STATE };
    setData["Chief Complaint"] = response[0];
    setData["Past History"] = response[1];
    setData["Treatment History"] = response[2];
    setData["Personal/Occupational History"] = response[3];
    setData["General Examination"] = response[4];
    setData["Provisional Diagnosis"] = response[5];
    setData["Doctor Advice"] = response[6];
    setData["Diet"] = response[7];
    setData["Investigation(Lab & Radio)"] = response[8];
    setData["Prescribed Medicine"] = response[9];
    setData["Doctor Notes"] = response[10];
    setData["Prescribed Procedure"] = response[11];
    setData["Sign & Symptoms"] = response[12];
    setData["Vaccination Status"] = response[13];
    // setData["Molecular Allergies"] = response[14];
    setItems(setData);
  };

  // get doctor id
  const DoctorIDByEmployeeID = async (doctorID) => {
    try {
      const response = await CommonAPIGetDoctorIDByEmployeeID();
      return response?.data[0]?.doctorID;
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  // const handleFetchCrossConsultation = async () => {
  //   try {
  //     const response = await getListBindMenu("Cross Consultation");
  //     if (response?.success) {
  //       setItems((prevState) => ({
  //         ...prevState,
  //         CrossConsultation: response?.data,
  //       }));
  //     } else {
  //       notify(response?.message, "error");
  //     }
  //   } catch (error) {
  //     console.error("Error fetching data:", error);
  //   }
  // };

  // useEffect(() => {
  //   handleGetCrossConsultation()
  // },[])

  // debugger

  useEffect(() => {
    const fetchCurrentDoctor = async () => {
      const doctorID = await DoctorIDByEmployeeID();
      if (doctorID && GetBindAllDoctorConfirmationData.length > 0) {
        // Find the doctor's name using the doctorID
        const doctor = GetBindAllDoctorConfirmationData.find(
          (doc) => doc.DoctorID === doctorID,
        );

        if (doctor) {
          setCurrentDoctor({
            label: doctor.Name, // Doctor's name
            value: doctor.DoctorID, // Doctor's ID
          });
        }
      }
    };

    fetchCurrentDoctor();
  }, [GetBindAllDoctorConfirmationData]);

  // Re-run when the doctor list is loaded

  useEffect(() => {
    if (
      GetBindAllDoctorConfirmationData.length > 0 &&
      currentDoctor.value !== "0"
    ) {
      // Find the current doctor in the list of doctors
      const defaultDoctor = GetBindAllDoctorConfirmationData.find(
        (doctor) => doctor.DoctorID === currentDoctor.value,
      );

      // Update the form field if the doctor is found
      if (defaultDoctor) {
        setFieldValue("doctorID", {
          label: defaultDoctor.Name,
          value: defaultDoctor.DoctorID,
        });
      }
    }
  }, [GetBindAllDoctorConfirmationData, setFieldValue, currentDoctor.value]);

  const isMobile = window.innerWidth > 1000;
  return (
    <div>
      {active ? (
        <>
          <form className="card patient_registration">
            <Heading
              title={t("View Consultation")}
              isBreadcrumb={true}
              // secondTitle={<div slot="head" className="doctor-cross-notification" style={{zIndex: 10000,paddingRight: "10px",position: "relative"}}>
              //   <i className="far fa-bell " style={{fontWeight:"700"}} />
              //   <span className="badge badge-primary navbar-badge">
              //     {5}
              //   </span>
              // </div>}
            />
            <div className="row p-2">
              <Input
                type="text"
                className="form-control"
                id="mrNo"
                name="mrNo"
                onChange={handleChange}
                value={values?.mrNo}
                lable={t("UHID")}
                placeholder=" "
                // required={true}
                respclass="col-xl-2 col-md-4 col-sm-4 col-12"
              />
              <Input
                type="text"
                className="form-control"
                id="pName"
                name="pName"
                onChange={handleChange}
                value={values?.pName}
                lable={t("PatientName")}
                placeholder=" "
                // required={true}
                respclass="col-xl-2 col-md-4 col-sm-4 col-12"
              />
              <Input
                type="text"
                className="form-control"
                id="appNo"
                name="appNo"
                onChange={handleChange}
                value={values?.appNo}
                lable={t("App. No.")}
                placeholder=" "
                // required={true}
                respclass="col-xl-2 col-md-4 col-sm-4 col-12"
              />
              <ReactSelect
                placeholderName={t("Specialization")}
                id={"docDepartment"}
                searchable={true}
                respclass="col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12"
                name={"docDepartment"}
                dynamicOptions={[
                  ViewConsultationPayload?.docDepartment,
                  ...GetDepartmentList.map((item) => {
                    return {
                      label: item?.Name,
                      value: item?.ID,
                    };
                  }),
                ]}
                value={values?.docDepartment?.value}
                // value={`${values?.docDepartment?.value ? parseInt(values?.docDepartment?.value) : values?.docDepartment}`}
                handleChange={handleReactSelectChange}
              />
              <ReactSelect
                placeholderName={t("Doctor")}
                searchableDoctorID={true}
                respclass="col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12"
                id={"doctorID"}
                name="doctorID"
                dynamicOptions={[
                  ViewConsultationPayload?.doctorID,
                  ...GetBindAllDoctorConfirmationData.map((item) => {
                    return {
                      label: item?.Name,
                      value: item?.DoctorID,
                    };
                  }),
                ]}
                value={values?.doctorID?.value}
                handleChange={handleReactSelect}
                // isDisabled={currentDoctor.value !== "0" && true}
              />
              <ReactSelect
                placeholderName={t("STATUS")}
                id={"status"}
                name="status"
                searchable={true}
                dynamicOptions={translateOptions(VIEWSTATUS, t)}
                // value={`${values?.status?.value? parseInt(values?.status?.value) : values?.status}`}
                value={
                  values?.status
                    ? values?.status
                    : parseInt(values?.status?.value)
                }
                handleChange={handleReactSelect}
                respclass="col-xl-2 col-md-4 col-sm-4 col-12"
              />

              <div className="col-xl-2 col-md-4 col-sm-4 col-12 mt-1">
                <div className="form-group">
                  <DatePicker
                    className="custom-calendar"
                    id="fromDate"
                    name="fromDate"
                    lable={t("FromDate")}
                    placeholder={VITE_DATE_FORMAT}
                    handleChange={handleChange}
                    // value={values?.Appfromdate}
                    value={
                      values.fromDate
                        ? moment(values?.fromDate, "DD-MMM-YYYY").toDate()
                        : values?.fromDate
                    }
                  />
                </div>
              </div>
              <div className="col-xl-2 col-md-4 col-sm-4 col-12 mt-1">
                <div className="form-group">
                  <DatePicker
                    className="custom-calendar"
                    id="toDate"
                    name="toDate"
                    lable={t("ToDate")}
                    placeholder={VITE_DATE_FORMAT}
                    handleChange={handleChange}
                    // value={values?.Apptodate}
                    value={
                      values.toDate
                        ? moment(values?.toDate, "DD-MMM-YYYY").toDate()
                        : values?.toDate
                    }
                  />
                </div>
              </div>
              <div className="col-xl-2 col-md-4 col-sm-4 col-12 mt-1">
                <button
                  className="btn btn-sm btn-success"
                  onClick={handleSubmit}
                >
                  {t("Search")}
                </button>
              </div>
            </div>
          </form>
          <div className="card patient_registration border">
            <div className="row p-2">
              {/* <div className="col-sm-2 d-flex">
                <div className="statusRescheduled"></div>
                <label className="text-dark ml-2">{t("Emergency")}</label>
              </div> */}
              <div className="col-sm-2 d-flex">
                <ColorCodingSearch
                  label={t("Emergency")}
                  color={"color-indicator-2-bg"}
                />
              </div>
              <div className="col-sm-2 d-flex">
                {/* <div className="statusPending"></div>
                <label className="text-dark ml-2">
                  {t("Pending Temp Status")}
                </label> */}

                <ColorCodingSearch
                  label={t("Pending Temp Status")}
                  color={"color-indicator-3-bg"}
                />
              </div>

              <div className="col-sm-2 d-flex">
                {/* <div className="statusConfirmed"></div>
                <label className="text-dark ml-2">{t("Refer")}</label> */}

                <ColorCodingSearch
                  label={t("Refer")}
                  color={"color-indicator-19-bg"}
                />
              </div>
              <div className="col-sm-2 d-flex">
                {/* <div className="statusCanceled"></div>
                <label className="text-dark ml-2">{t("Viewed & IN")}</label> */}

                <ColorCodingSearch
                  label={t("Viewed & IN")}
                  color={"color-indicator-16-bg"}
                />
              </div>
              <div className="col-sm-2 d-flex">
                {/* <div className="statusUnregistered"></div>
                <label className="text-dark ml-2">{t("Hold")}</label> */}

                <ColorCodingSearch
                  label={t("Hold")}
                  color={"color-indicator-9-bg"}
                />
              </div>
              <div className="col-sm-2 d-flex">
                <ColorCodingSearch label={t("Urgent")} color="#ff6b6b" />
              </div>
            </div>
          </div>

          <div className="card patient_registration border">
            <div className="row appointment-container d-flex flex-wrap  ">
              <div className="col-sm-12 col-md-12 col-lg-12 col-12">
                <div className="card-header">
                  <div className="Card_title">
                    {t("Pending Appointment Patient List")}
                  </div>
                </div>

                <div className="card patient_registration_card  ">
                  <PendingAppointmentsModern
                  tbody={bodyData.SearchViewConsultaionList}
                  handleCallButtonClick={handleCallButtonClick}
                  handlePatientSelect={handlePatientSelect}
                  setSelectedPatient={setSelectedPatient}
                  setShowFlowSheet={setShowFlowSheet}
                  setShowMedicationCalendar={setShowMedicationCalendar}
                  setShowNotesModal={setShowNotesModal}
                  showInvitePatient={showInvitePatientColumn}
                  showRPM={showRPMColumn}
                />
                </div>
              </div>
              <div className="col-sm-12 col-md-12 col-lg-12 col-12">
                <div className="card-header">
                  <div className="Card_title">
                    {t("Done Appointment Patient List")}
                  </div>
                </div>
                <div className="card patient_registration_card">
                  <DoneAppointmentsModern
                  tbody={bodyData?.DoneAppointmentListList}
                  handlePatientSelect={handlePatientSelect}
                  showRPM={showRPMColumn}
                />
                </div>
              </div>
            </div>
          </div>

          {/* )} */}
        </>
      ) : null}
      {!active && (
        <AppointmentPatientDetail
          setActive={setActive}
          isDesktop={isMobile}
          selectedIndex={selectedIndex.index}
          calledPatient={calledPatient}
          getUpdateInAPI={getUpdateInAPI}
          handleSearchPrescribeMedicine={handleSearchPrescribeMedicine}
          TotaltableData={
            selectedIndex.listType === "Pending"
              ? bodyData?.SearchViewConsultaionList
              : bodyData?.DoneAppointmentListList
          }
          handleCallButtonClick={handleCallButtonClick}
          SearchOPDBillsCallAPI={SearchOPDBillsCallAPI}
          getDoctorID={getDoctorID}
          items={items}
          setItems={setItems}
          fetchAllApiData={fetchAllApiData}
          checkGetDoctorIDForTransationID={checkGetDoctorIDForTransationID}
          getUser={getUser}
          docterError={docterError}
          getCall={getCall}
          docID={docID}
          getUpdateCallAPI={getUpdateCallAPI}
          getUpdateUncall={getUpdateUncall}
          setMedicalInfoData={setMedicalInfoData}
          medicalData={medicalData}
          setShowFlowSheet={setShowFlowSheet}
          setShowMedicationCalendar={setShowMedicationCalendar}
          setShowNotesModal={setShowNotesModal}
          showFlowSheet={showFlowSheet}
          showMedicationCalendar={showMedicationCalendar}
          showNotesModal={showNotesModal}
        />
      )}
      {showFlowSheet && (
        <Modal
          visible={showFlowSheet}
          setVisible={setShowFlowSheet}
          Header={t("Flow Sheet")}
          modalWidth="90vw"
          footer={<></>}
        >
          <FlowsheetModel
            data={selectedPatient}
            setShowMedicationCalendar={setShowMedicationCalendar}
            setShowNotesModal={setShowNotesModal}
            setShowFlowSheet={setShowFlowSheet}
          />
        </Modal>
      )}
      {showMedicationCalendar && (
        <Modal
          visible={showMedicationCalendar}
          setVisible={setShowMedicationCalendar}
          Header={t("Medication Calendar")}
          modalWidth="97vw"
          footer={<></>}
        >
          <MedicationCalendar
            data={showMedicationCalendar}
            setShowFlowSheet={setShowFlowSheet}
            setShowNotesModal={setShowNotesModal}
            setShowMedicationCalendar={setShowMedicationCalendar}
          />
        </Modal>
      )}
      {showNotesModal && (
        <Modal
          visible={showNotesModal}
          setVisible={setShowNotesModal}
          Header={t("Prescription Calendar")}
          modalWidth="97vw"
          footer={<></>}
        >
          <PatientSummaryCalendar
            data={showNotesModal}
            getUpdateInAPI={getUpdateInAPI}
            setShowFlowSheet={setShowFlowSheet}
            setShowNotesModal={setShowNotesModal}
            setShowMedicationCalendar={setShowMedicationCalendar}
          />
        </Modal>
      )}
    </div>
  );
};

export default ViewConsultation;
