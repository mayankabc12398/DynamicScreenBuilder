import { Tooltip } from "primereact/tooltip";
import React, { useEffect, useState } from "react";
import LabeledInput from "../formComponent/LabeledInput";
import SendSMSDoctor from "../modalComponent/Utils/SendSMSDoctor";
import SendEmailDoctor from "../modalComponent/Utils/SendEmailDoctor";
import DoctorDetails from "../HelpDesk/DoctorDetails";
import {
  DoctorPrescriptionPrintPDF,
  GetOpdPrintOptionsApi,
  UpdateCall,
  UpdateUncall,
} from "../../networkServices/DoctorApi";
import { apiField, notify } from "../../utils/utils";
import { useDispatch, useSelector } from "react-redux";
import { getBindVital } from "../../store/reducers/DoctorModule/VitalSign";
import OverLay from "../modalComponent/OverLay";
import { Link } from "react-router-dom";
import SeeMore from "../UI/SeeMore";
import Modal from "../modalComponent/Modal";
import VideoCallModal from "../modalComponent/VideoCallModal";
import SlideScreen from "../front-office/SlideScreen";
import PrintDesign from "./PrintDesign";
import { OpenPDFURL, RedirectURL } from "../../networkServices/PDFURL";
import noImange from "../../assets/image/avatar.gif";
import DatePicker from "../formComponent/DatePicker";
import { current } from "@reduxjs/toolkit";
import { useLocalStorage } from "../../utils/hooks/useLocalStorage";
import DoctorPrescriptionModalPrint from "../../pages/Purchase/Order/PurchaseOrderApproval/DoctorPrescriptionModalPrint";
import ViewPrescriptionButtonModal from "./ViewPrescriptionButtonModal";
import PrintLanguageModal from "./PrintLanguageModal";
import { translateIfKnown } from "../WrapTranslate";
import { translatePrescriptionTexts } from "../../utils/prescriptionTranslate";
import {
  PrescriptionPrintLanguageGetDefault,
  PrescriptionPrintLanguageSetDefault,
} from "../../networkServices/PrescriptionPrintLanguageApi";
import RegistrationDocumentsModal from "./RegistrationDocumentsModal";
import TumorBoardToolbar from "../TumorBoard/TumorBoardToolbar";
import { FileOpenIcon } from "../SvgIcons";
import i18next from "i18next";
const t = (key, options) => i18next.t(key, options);
import { setLoading } from "../../store/reducers/loadingSlice/loadingSlice";
import store from "../../store/store";
import { APIBaseURL } from "../../networkServices/axiosInstance";
import { MdNoteAlt } from "react-icons/md";
// Colourful image icons for the toolbar (assets/image/doctor-toolbar - reusable set)
import tbPrev from "../../assets/image/doctor-toolbar/prev.svg";
import tbNext from "../../assets/image/doctor-toolbar/next.svg";
import tbNotepad from "../../assets/image/doctor-toolbar/notepad.svg";
import tbFlowsheet from "../../assets/image/doctor-toolbar/flowsheet.svg";
import tbNotes from "../../assets/image/doctor-toolbar/notes.svg";
import tbMedicines from "../../assets/image/doctor-toolbar/medicines.svg";
import tbSave from "../../assets/image/doctor-toolbar/save.svg";
import tbOldPres from "../../assets/image/doctor-toolbar/oldpres.svg";
import tbPrint from "../../assets/image/doctor-toolbar/print.svg";
import tbCopy from "../../assets/image/doctor-toolbar/copy.svg";
import tbCall from "../../assets/image/doctor-toolbar/call.svg";
import tbUncall from "../../assets/image/doctor-toolbar/uncall.svg";
import tbOutPatient from "../../assets/image/doctor-toolbar/outpatient.svg";
import tbInPatient from "../../assets/image/doctor-toolbar/inpatient.svg";
import tbHold from "../../assets/image/doctor-toolbar/hold.svg";
import tbMic from "../../assets/image/doctor-toolbar/mic.svg";
import tbFileClosed from "../../assets/image/doctor-toolbar/fileclosed.svg";
import tbFileOpen from "../../assets/image/doctor-toolbar/fileopen.svg";
import tbDraft from "../../assets/image/doctor-toolbar/draft.svg";
import tbClear from "../../assets/image/doctor-toolbar/clear.svg";
import tbMail from "../../assets/image/doctor-toolbar/mail.svg";
import tbDocument from "../../assets/image/doctor-toolbar/document.svg";
import tbRegDocs from "../../assets/image/doctor-toolbar/regdocs.svg";
import tbVideo from "../../assets/image/doctor-toolbar/video.svg";
import { FaFileMedical } from "react-icons/fa";
import { GiMedicines } from "react-icons/gi";
import { FaKitMedical } from "react-icons/fa6";

const UserInfoPedia = (props) => {
  const dispatch = useDispatch();
  // const baseurl = import.meta.env.VITE_APP_REACT_APP_BASE_URL;
  const dynamicUrl = import.meta.env.VITE_APP_REACT_APP_DYNAMIC_URL === "true";
  const baseFromEnv = import.meta.env.VITE_APP_REACT_APP_BASE_URL;
  const baseUrl = dynamicUrl
    ? `${window.location.protocol}//${window.location.hostname}${
        window.location.port ? `:${window.location.port}` : ""
      }/api/v1`
    : baseFromEnv;
  const baseurl = baseUrl;

  const { employeeID } = useLocalStorage("userData", "get");

  const {
    pregnancyDetails,
    tags,
    setTags,
    items,
    setPregnancyDetails,
    patientDetail,
    handleCallButtonClick,
    handleFileClosed,
    handleFileOpen,
    reverseTableData,
    forwardTableData,
    handleEmailModalOpen,
    handleSMSModalOpen,
    getHoldAPID,
    getOutPatientAPI,
    getUpdateInAPI,
    handleSavePriscciptionForm,
    handleClearForm,
    SearchOPDBillsCallAPI,
    TotaltableData,
    selectedIndex,
    setIsListening,
    handleSavePrescriptionDraft,
    apiData,
    handleGetDataForOLDAppointment,
    getGetDoctor,
    docterError,
    getCall,
    loadSaveData,
    prescription,
    toggleListening,
    isListening,
    type,
    setIsDesktop,
    isDesktop,
    isPrescriptionButton,
    setIsPrescriptionButton,
    runReport,
    setRunReport,
    handleSpouseDetailsChange,
    setShowAISummary,
    showAISummary,
    setShowNotPad,
    showFlowSheet,
    showMedicationCalendar,
    showNotesModal,
    setShowFlowSheet,
    setShowMedicationCalendar,
    setShowNotesModal,
  } = props;

  const [handleModelData, setHandleModelData] = useState({});
  // Documents scanned in at Patient Registration (patient + panel), read-only.
  const [showRegDocs, setShowRegDocs] = useState(false);
  useEffect(() => {
    dispatch(getBindVital(patientDetail?.currentPatient?.TransactionID));
  }, [dispatch]);
  const [visible, setVisible] = useState(false);
  const [mappedData, setMappedData] = useState({});
  const [isVisibleOldPrescription, setIsVisibleOldPrescription] =
    useState(false);

  function handleConvertFormat(data) {
    const values = data?.valueField.split("#");
    const keys = data?.valueFieldDesc.split("#");

    const keyValueMap = keys.reduce((acc, key, index) => {
      acc[key] = values[index];
      return acc;
    }, {});

    setMappedData(keyValueMap);
    DoctorPrescriptionPrint(keyValueMap);
  }

  const removeTag = (category, indexToRemove, id) => {
    let ID = Number(id) ? id : undefined;
    const singleData = JSON.parse(JSON.stringify([...items[category]]));
    if (ID) {
      const index = singleData.findIndex(
        (itd) => Number(itd?.ID) === Number(ID),
      );
      if (index) {
        singleData[index]["isChecked"] = false;
        setItems({ ...items, [category]: singleData });
      }
    }

    setTags((prevTags) => ({
      ...prevTags,
      [category]: prevTags[category]?.filter(
        (_, index) => index !== indexToRemove,
      ),
    }));
  };

  const handleClose = () => {
    setHandleModelData((val) => ({ ...val, isOpen: false }));
  };

  const [openVideoPopup, setOpenVideoPopup] = useState({
    name: "",
    component: "",
    size: "",
    isShow: false,
  });

  const handleVideoPopupOpen = () => {
    const url = patientDetail?.currentPatient?.DoctorMeetingUrl;

    // Open Meet in a normal browser tab (NOT a popup window). Google Meet's
    // auto Picture-in-Picture only fires when its page becomes hidden, which
    // happens when you switch tabs. A separate popup window stays "visible"
    // behind the EMR, so PiP never triggers there.
    window.open(url, "_blank");

    // One-time hint explaining how to get the floating (PiP) call: after
    // joining, the doctor switches back to the patient tab and Meet floats.
    const PIP_HINT_KEY = "doctorMeetPipHintShown";
    if (!localStorage.getItem(PIP_HINT_KEY)) {
      notify(
        "Tip: After joining the call, click back to this patient tab — Google Meet will float the call on top (Picture-in-Picture).",
        "warn",
      );
      localStorage.setItem(PIP_HINT_KEY, "true");
    }
  };

  const handleClickJoinMetting = () => {
    const newWindow = window.open(
      patientDetail?.currentPatient?.DoctorMeetingUrl,
      "_blank",
      "width=200,height=200",
    );
    if (newWindow) {
      newWindow.focus();
    }
  };

  useEffect(() => {
    if (openVideoPopup.isShow) {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((stream) => {
          notify(t("Camera and microphone access granted."), "success");
        })
        .catch((error) => {
          console.error("Camera and microphone access denied.", error);
          notify(
            t("Please allow camera and microphone access to join the meeting."),
            "error",
          );
        });
    }
  }, [openVideoPopup.isShow]);

  // Header checkbox for the printout.
  // Unticked by default: the usual paper here is pre printed letterhead, so the
  // letterhead is not printed but its space is still left free. Tick it to print
  // the letterhead on plain paper.
  const [printWithHeader, setPrintWithHeader] = useState(false);

  // Per site switch, kept in fin_global_resources:
  //     Name = 'ShowPrescriptionHeaderCheckbox', Value = '1' shows it.
  // No row, or '0', means the checkbox is not shown on that site and the header
  // prints as it always has.
  const { BindResource } = useSelector((state) => state?.CommonSlice);
  const showHeaderCheckbox =
    String(BindResource?.ShowPrescriptionHeaderCheckbox ?? "0") === "1";

  // Print language: fin_global_resources.Name = 'PrescriptionPrintLanguage', Value = '1'.
  // Off or missing, Print behaves exactly as it always has. On, Print asks for a language
  // (from the language master) until the doctor saves a default, then prints straight in it;
  // the API translates the prescription. "English" prints as written.
  const { GetGlobalResources } = useSelector((state) => state?.CommonSlice);
  const isPrintLanguageEnabled =
    String(
      BindResource?.PrescriptionPrintLanguage ??
        (Array.isArray(GetGlobalResources)
          ? GetGlobalResources.find((item) => item?.Name === "PrescriptionPrintLanguage")?.Value
          : undefined) ??
        "0",
    ).trim() === "1";
  const [printLang, setPrintLang] = useState("");
  const [langPickerOpen, setLangPickerOpen] = useState(false);

  useEffect(() => {
    if (!isPrintLanguageEnabled) return;
    (async () => {
      const res = await PrescriptionPrintLanguageGetDefault();
      if (res?.success) setPrintLang(apiField(res.data, "language") || "");
    })();
  }, [isPrintLanguageEnabled]);

  const handlePrintClick = () => {
    if (!isPrintLanguageEnabled || printLang) {
      DoctorPrescriptionPrint(undefined, printLang || undefined);
      return;
    }
    setLangPickerOpen(true);
  };

  const handlePrintInLanguage = async (language, makeDefault) => {
    setLangPickerOpen(false);
    if (makeDefault) {
      const res = await PrescriptionPrintLanguageSetDefault(language);
      if (res?.success) setPrintLang(language);
      else notify(res?.message || t("Could not save the default language"), "warn");
    }
    DoctorPrescriptionPrint(undefined, language);
  };

  // Change the saved default without printing anything.
  const handleSaveDefaultOnly = async (language) => {
    const res = await PrescriptionPrintLanguageSetDefault(language);
    if (res?.success) {
      setPrintLang(language);
      notify(`${t("Default print language")}: ${language}`, "success");
      setLangPickerOpen(false);
    } else {
      notify(res?.message || t("Could not save the default language"), "warn");
    }
  };

  // Remove the default: Print opens the language box again each time.
  const handleClearDefault = async () => {
    const res = await PrescriptionPrintLanguageSetDefault("");
    if (res?.success) {
      setPrintLang("");
      notify(t("Print will ask for the language each time"), "success");
      setLangPickerOpen(false);
    } else {
      notify(res?.message || t("Could not change the default language"), "warn");
    }
  };

  const DoctorPrescriptionPrint = async (data, languageOverride) => {
    const updatedPrescriptions = prescription.map((item) => ({
      ...item,
      IsChecked: 1,
    }));

    if (updatedPrescriptions?.length === 0) return;
    const patientData = patientDetail?.currentPatient;

    store.dispatch(setLoading(true));
    try {
      let payload = {
        pid: data ? data?.PatientID : patientData?.PatientID,
        transactionID: data ? data?.TransactionID : patientData?.TransactionID,
        appID: data ? data?.App_ID : patientData?.App_ID,
        previewSetting: updatedPrescriptions?.map((item) => {
          return {
            MasterId: item?.ID,
            IsChecked: 1,
            AccordianName: item?.AccordianName,
          };
        }),
        printWithHeader: printWithHeader,
      };
      const printLanguage = isPrintLanguageEnabled ? languageOverride ?? printLang : "";
      if (printLanguage && printLanguage !== "English") payload.language = printLanguage;

      let apiResp = await DoctorPrescriptionPrintPDF(payload);

      // A translated print is two rounds. The first returns the texts nobody has translated yet
      // (the API already did the fixed labels and masked the patient's identifiers); they are
      // translated here with the same AI key the other AI features use, and the request is sent
      // again with the answers.
      const askedToTranslate =
        apiResp?.success && apiResp?.data && typeof apiResp.data === "object"
          ? apiResp.data
          : null;
      if (askedToTranslate && apiField(askedToTranslate, "needsTranslation")) {
        try {
          payload.translations = await translatePrescriptionTexts(
            apiField(askedToTranslate, "texts") || [],
            apiField(askedToTranslate, "language") || payload.language,
          );
        } catch (translationError) {
          console.log(translationError);
          notify(
            t("The prescription could not be translated. Please try again or print in English"),
            "error",
          );
          return;
        }
        apiResp = await DoctorPrescriptionPrintPDF(payload);
      }

      if (apiResp?.success && apiResp?.data) {
        let pdfUrl = apiResp?.data;
        if (pdfUrl?.toLowerCase().endsWith(".html")) {
          window.open(pdfUrl, "_blank");
          return;
        } else if (pdfUrl && pdfUrl.startsWith("https://")) {
          pdfUrl = pdfUrl;
        } else {
          pdfUrl = `${baseurl}/${apiResp?.data}`;
        }

        setHandleModelData({
          isOpen: true,
          width: "100vw",
          label: isPrintLanguageEnabled ? (
            <span className="d-flex align-items-center" style={{ gap: 10 }}>
              {t("Doctor Prescription")}
              <button
                type="button"
                className="btn btn-sm bg-white text-dark py-0"
                onClick={() => setLangPickerOpen(true)}
                title={t("Print in another language")}
              >
                <i className="fas fa-globe mr-1" aria-hidden="true" />
                {printLanguage || "English"} &middot; {t("Change language")}
              </button>
            </span>
          ) : (
            "Doctor Prescription"
          ),
          Component: <DoctorPrescriptionModalPrint url={pdfUrl} />,
        });
      } else if (payload.language && apiResp && !apiResp.success) {
        // A translation that could not be produced must be said, not shown as a blank screen.
        // An HTTP error reaches here as the raw axios response, so the server's text is at data.message.
        const reason = apiResp.message || (typeof apiResp.data === "object" ? apiResp.data?.message : "");
        notify(reason || t("Failed to load the preview"), "error");
      }
      store.dispatch(setLoading(false));
    } catch (error) {
      console.log(error);
      notify(t("Failed to load the preview"), "error");
      store.dispatch(setLoading(false));
    } finally {
      setIsVisibleOldPrescription(false);
      store.dispatch(setLoading(false));
    }
  };

  const isMobile = window.innerWidth > 1000;

  useEffect(() => {
    if (runReport) {
      DoctorPrescriptionPrint();
      setRunReport(false);
    }
  }, [runReport]);

  return (
    <>
      <div className="pl-2">
        {handleModelData?.isOpen && (
          <Modal
            visible={handleModelData?.isOpen}
            setVisible={handleClose}
            modalWidth="98vw"
            Header={handleModelData?.label}
            buttonType={"button"}
            footer={<></>}
            style={{ maxHeight: "99% !important", backgroundColor: "red" }}
          >
            {handleModelData?.Component}
          </Modal>
        )}
      </div>

      <div className="card sticky-button-groups">
        <div className="row mt-2">
          {type !== "Emergency" && (
            <div className="col-sm-1">
              <div className="row p-1">
                <div
                  className="col-md-12"
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItem: "center",
                  }}
                >
                  <img
                    src={
                      patientDetail?.currentPatient?.PatientPhoto
                        ? patientDetail?.currentPatient?.PatientPhoto
                        : noImange
                    }
                    className="emp-img"
                    alt="Responsive image"
                  />
                </div>
              </div>
            </div>
          )}
          {type !== "Emergency" && (
            <div className="col-sm-11">
              <div className="row px-1">
                <div className="col-xl-2 col-md-4 col-sm-4 col-12">
                  <LabeledInput
                    label={t("Patient Name")}
                    value={patientDetail?.currentPatient?.Pname}
                  />
                </div>

                <div className="col-xl-2 col-md-4 col-sm-4 col-12">
                  <LabeledInput
                    label={t("Age/Gender")}
                    value={
                      <span>
                        {patientDetail?.currentPatient?.Age}/
                        {patientDetail?.currentPatient?.Gender}
                      </span>
                    }
                  />
                </div>
                <div className="col-xl-2 col-md-4 col-sm-4 col-12">
                  <LabeledInput
                    label={t("Mobile")}
                    value={patientDetail?.currentPatient?.ContactNo}
                  />
                </div>
                <div className="col-xl-2 col-md-4 col-sm-4 col-12">
                  <LabeledInput
                    label={t("Ref.By")}
                    value={patientDetail?.currentPatient?.DName}
                  />
                </div>

                <div className="col-xl-2 col-md-4 col-sm-4 col-12">
                  <LabeledInput
                    label={t("App. Date/No.")}
                    value={
                      <span>
                        {patientDetail?.currentPatient?.AppointmentDate}/
                        {patientDetail?.currentPatient?.AppNo}
                      </span>
                    }
                  />
                </div>

                <div className="col-xl-2 col-md-4 col-sm-4 col-12">
                  <LabeledInput
                    label={t("Panel")}
                    value={patientDetail?.currentPatient?.PanelName}
                  />
                </div>
              </div>

              <div className="row p-1 rx-doc-toolbar">
                <div className="col-lg-5 col-sm-12 main_container">
                  <div className="h-100">
                    <ul className="dddUL">
                      <li>
                        {prescription
                          ?.filter((val) => val.ID == 32)
                          ?.map((item, index) => (
                            <>
                              {tags[item?.AccordianName]?.length > 0 && (
                                <div className="">
                                  <div className="p-1 d-flex align-items-center ">
                                    <h4 className="mr-2">
                                      {item?.DisplayName}:{" "}
                                    </h4>
                                    {tags[item?.AccordianName]?.map(
                                      (tag, index) => (
                                        <>
                                          <span
                                            key={index}
                                            className="tag mr-2"
                                            style={{
                                              backgroundColor: tag?.ID
                                                ? "#FEFAE0"
                                                : "#F5EDED",
                                              display: "inline-table",
                                            }}
                                          >
                                            {tag?.ValueField || tag?.TypeName}
                                            <span
                                              className="tag-close-icon"
                                              onClick={() =>
                                                removeTag(
                                                  item?.AccordianName,
                                                  index,
                                                  tag?.ID,
                                                )
                                              }
                                            >
                                              <i
                                                className="fa fa-times-circle"
                                                aria-hidden="true"
                                              ></i>
                                            </span>
                                          </span>
                                        </>
                                      ),
                                    )}
                                  </div>
                                </div>
                              )}
                            </>
                          ))}
                      </li>

                      <li>
                        {prescription
                          ?.filter((val) => val.ID == 33)
                          ?.map((item, index) => (
                            <>
                              {tags[item?.AccordianName]?.length > 0 && (
                                <div className="">
                                  <div className="p-1 d-flex align-items-center ">
                                    <h4 className="mr-2">
                                      {item?.DisplayName}:{" "}
                                    </h4>
                                    {tags[item?.AccordianName]?.map(
                                      (tag, index) => (
                                        <>
                                          <span
                                            key={index}
                                            className="tag mr-2"
                                            style={{
                                              backgroundColor: tag?.ID
                                                ? "#FEFAE0"
                                                : "#F5EDED",
                                              display: "inline-table",
                                            }}
                                          >
                                            {tag?.ValueField || tag?.TypeName}
                                            <span
                                              className="tag-close-icon"
                                              onClick={() =>
                                                removeTag(
                                                  item?.AccordianName,
                                                  index,
                                                  tag?.ID,
                                                )
                                              }
                                            >
                                              <i
                                                className="fa fa-times-circle"
                                                aria-hidden="true"
                                              ></i>
                                            </span>
                                          </span>
                                        </>
                                      ),
                                    )}
                                  </div>
                                </div>
                              )}
                            </>
                          ))}
                      </li>

                      {loadSaveData?.vitalSign?.isPregnancy === 1 &&
                        Number(pregnancyDetails?.ga) > 0 && (
                          <li>
                            <div className="d-flex align-items-center">
                              <div className="p-1 d-flex align-items-center">
                                <h4 className="mr-2 font-weight-bold">
                                  {t("G.Age (weeks):")}
                                </h4>
                                <p
                                  className="default-font-size"
                                  style={{
                                    margin: 0,
                                    padding: 0,
                                  }}
                                >
                                  {pregnancyDetails?.ga}
                                </p>
                              </div>
                            </div>
                          </li>
                        )}
                    </ul>
                  </div>
                </div>

                <div className="col-lg-7 col-md-12">
                  <div className="button_group">
                    {/* Navigation Buttons */}
                    <span
                      onClick={reverseTableData}
                      disabled={patientDetail?.currentPatient?.index === 0}
                    >
                      <img src={tbPrev} className="rx-tb-ico" alt="" title={t("Previous patient")} />
                    </span>

                    <span
                      onClick={forwardTableData}
                      disabled={
                        patientDetail?.currentPatient?.index ===
                        patientDetail?.currentPatient?.TotaltableData?.length -
                          1
                      }
                    >
                      <img src={tbNext} className="rx-tb-ico" alt="" title={t("Next patient")} />
                    </span>
                    <button
                      className="btn btn-sm text-white mx-2"
                      onClick={() => setShowNotPad(true)}
                    >
                      <img src={tbNotepad} className="rx-tb-ico" alt="" title={t("Notepad")} />
                    </button>
                    {/* --------------------------------- */}
                    <button
                      className="btn btn-sm d-inline-flex align-items-center gap-2 px-3 py-1.5 btn-primary mx-1"
                      title={t("Flow Sheet")}
                      onClick={() => {
                        setShowFlowSheet(patientDetail?.currentPatient);
                        setShowMedicationCalendar(false);
                        setShowNotesModal(false);
                      }}
                    >
                      <img src={tbFlowsheet} className="rx-tb-ico" alt="" title={t("Flow Sheet")} />
                    </button>
                    <button
                      className="btn btn-sm d-inline-flex align-items-center gap-2 px-3 py-1.5 btn-primary  mx-1"
                      title={t("Notes")}
                      onClick={() => {
                        setShowNotesModal(patientDetail?.currentPatient);
                        setShowMedicationCalendar(false);
                        setShowFlowSheet(false);
                      }}
                    >
                      <img src={tbNotes} className="rx-tb-ico" alt="" title={t("Notes")} />
                    </button>
                    <button
                      className="btn btn-sm text-white mx-2"
                      onClick={() => {
                        setShowMedicationCalendar(patientDetail?.currentPatient);
                        setShowNotesModal(false);
                        setShowFlowSheet(false);
                      }}
                    >
                      <img src={tbMedicines} className="rx-tb-ico" alt="" title={t("Medication Calendar")} />
                    </button>
                    {/* Registration documents - the ID proof / panel scans the
                        front office uploaded, so the doctor need not leave the EMR. */}
                    <button
                      className="btn btn-sm text-white mx-2"
                      title={t("Registration Documents")}
                      onClick={() => setShowRegDocs(true)}
                    >
                      <img src={tbRegDocs} className="rx-tb-ico" alt="" data-pr-tooltip={translateIfKnown(t, "Registration Documents")} data-pr-position="top" id="RegDocs" title={t("Registration Documents")} />
                      <Tooltip target="#RegDocs" />
                    </button>
                    {/* Tumor Board: the flag button, and - only once the board has
                        recorded a discussion - the button that shows it. One status
                        call per patient, inside the component. */}
                    <TumorBoardToolbar patient={patientDetail?.currentPatient} />

                    {/* Save & Preview Button */}
                    <button
                      className="btn btn-sm text-white"
                      onClick={() => {
                        handleSavePriscciptionForm("save");
                      }}
                    >
                      <span className="d-flex align-items-center">
                        {t("Save & Preview")}
                        <img src={tbSave} className="rx-tb-ico rx-tb-ico--inline" alt="" data-pr-tooltip={translateIfKnown(t, "Save")} data-pr-position="top" id="SaveForm" title={t("Save & Preview")} />
                      </span>
                      <Tooltip target="#SaveForm" />
                    </button>

                    {/* Old Prescription Dropdown */}
                    <SeeMore
                      Header={
                        <button className="btn btn-sm text-white ml-1">
                          {t("Old Pres")}
                          <div className="text-center">
                            <img src={tbOldPres} className="rx-tb-ico rx-tb-ico--inline" alt="" title={t("Old Prescriptions")} />
                          </div>
                        </button>
                      }
                      isVisibleOldPrescription={isVisibleOldPrescription}
                    >
                      <ul
                        className={`${handleModelData.isOpen ? "d-none" : ""} list-group upperList`}
                        style={{ whiteSpace: "nowrap" }}
                      >
                        {apiData?.getOldAppointentDataAPI
                          ?.slice()
                          .reverse()
                          .map((e, index) => (
                            <div
                              key={index}
                              className="d-flex align-items-center justify-content-between"
                              style={{
                                border: "1px solid rgba(0, 0, 0, .125)",
                                height: "fit-content",
                              }}
                            >
                              <li
                                className={`${e?.canCopy == 0 ? "disable-reject " : ""}list-group-item p-2`}
                                onClick={() =>
                                  handleGetDataForOLDAppointment(e)
                                }
                                style={{
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  border: "none",
                                  color: e.isCurrent === 1 && "red",
                                }}
                              >
                                {e?.textField}
                              </li>
                              <i
                                className="fa fa-eye pr-1 pointer-cursor"
                                onClick={() => {
                                  handleConvertFormat(e);
                                }}
                              ></i>
                            </div>
                          ))}
                      </ul>
                    </SeeMore>
                    {console.log(
                      "SpouseData",
                      apiData?.getOldSpouseAppointentDataAPI?.appointments,
                    )}
                    {/* Split Spouse start */}
                    {apiData?.getOldSpouseAppointentDataAPI?.appointments
                      ?.length > 0 && (
                      <SeeMore
                        Header={
                          <button className="btn btn-sm text-white ml-1">
                            {t("Split Spouse")}
                            <div className="text-center">
                              <i
                                className="fa fa-retweet ml-2 my-2 text-icon-size"
                                aria-hidden="true"
                              ></i>
                            </div>
                          </button>
                        }
                        isVisibleOldPrescription={isVisibleOldPrescription}
                      >
                        <ul
                          className={`${handleModelData.isOpen ? "d-none" : ""} list-group upperList`}
                          style={{ whiteSpace: "nowrap" }}
                        >
                          {apiData?.getOldSpouseAppointentDataAPI?.appointments
                            ?.slice()
                            .reverse()
                            .map((e, index) => (
                              <div
                                key={index}
                                className="d-flex align-items-center justify-content-between"
                                style={{
                                  border: "1px solid rgba(0, 0, 0, .125)",
                                  height: "fit-content",
                                }}
                              >
                                <li
                                  className={`${e?.canCopy == 0 ? "disable-reject " : ""}list-group-item p-2 w-100`}
                                  onClick={() => {
                                    handleSpouseDetailsChange(e);
                                  }}
                                  style={{
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    border: "none",
                                    color: e.isCurrent === 1 && "red",
                                  }}
                                >
                                  {e?.TextField || e?.textField}
                                </li>
                              </div>
                            ))}
                        </ul>
                      </SeeMore>
                    )}
                    {/* Split Spouse end */}

                    {/* Print with the hospital letterhead - per site */}
                    {showHeaderCheckbox && (
                    <label className="ml-2 mb-0 d-inline-flex align-items-center">
                      <input
                        type="checkbox"
                        className="mr-1"
                        checked={printWithHeader}
                        onChange={(e) => setPrintWithHeader(e.target.checked)}
                      />
                      {t("Header")}
                    </label>
                    )}

                    {/* Print Button */}
                    <button
                      className="btn btn-sm text-white ml-1"
                      onClick={handlePrintClick}
                    >
                      {t("Print")}
                      <span>
                        <img src={tbPrint} className="rx-tb-ico rx-tb-ico--inline" alt="" data-pr-tooltip={translateIfKnown(t, "Print")} data-pr-position="top" id="Print" title={t("Print / Preview")} />
                        <Tooltip target="#Print" />
                      </span>
                    </button>
                    {isPrintLanguageEnabled && (
                      <button
                        type="button"
                        className="btn btn-sm text-white ml-1"
                        onClick={() => setLangPickerOpen(true)}
                        title={`${t("Print Language")}${printLang ? `: ${printLang}` : ""}`}
                        aria-label={t("Print Language")}
                      >
                        <i className="fas fa-globe" />
                        <span className="ml-1">{printLang || t("Language")}</span>
                      </button>
                    )}
                    <PrintLanguageModal
                      visible={langPickerOpen}
                      setVisible={setLangPickerOpen}
                      initialLanguage={printLang}
                      defaultLanguage={printLang}
                      onPrint={handlePrintInLanguage}
                      onSaveDefault={handleSaveDefaultOnly}
                      onClearDefault={handleClearDefault}
                    />

                    {/* Ai Patient Summary - Smooth Blend Blue Pill */}
                    <button
                      onClick={() => setShowAISummary(!showAISummary)}
                      style={{
                        position: "relative",
                        border: "none",
                        outline: "none",
                        padding: "6px 20px",
                        cursor: "pointer",
                        borderRadius: "100px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        background:
                          "linear-gradient(90deg, #1e3a8a, #2563eb, #3b82f6, #60a5fa)",
                        color: "#ffffff",
                        boxShadow: "0 6px 18px rgba(0,100,200,0.35)",
                        transition: "all 0.3s ease",
                        marginLeft: "10px",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "scale(1.02)";
                        e.currentTarget.style.boxShadow =
                          "0 10px 25px rgba(0,100,200,0.5)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "scale(1)";
                        e.currentTarget.style.boxShadow =
                          "0 6px 18px rgba(0,100,200,0.35)";
                      }}
                    >
                      <span style={{ fontSize: "0.85em" }}>🔬</span>
                      <span
                        style={{
                          fontWeight: "600",
                          fontSize: "0.8em",
                          letterSpacing: "0.5px",
                        }}
                      >
                        {t("AI")}
                      </span>
                      <span
                        style={{
                          fontWeight: "600",
                          fontSize: "0.8em",
                          letterSpacing: "0.3px",
                        }}
                      >
                        {t("Assistance")}
                      </span>
                      <style>
                        {`
      @keyframes flash {
        0% { opacity: 0.5; transform: translateX(0); }
        100% { opacity: 1; transform: translateX(2.5px); }
      }
    `}
                      </style>
                    </button>

                    {/* Copy Button */}
                    <button
                      className="btn btn-sm text-white mx-1"
                      onClick={() => handleSavePriscciptionForm("copy")}
                    >
                      {t("Copy")}
                      <span>
                        <img src={tbCopy} className="rx-tb-ico rx-tb-ico--inline" alt="" data-pr-tooltip={translateIfKnown(t, "Copy")} data-pr-position="top" id="CopyForm" title={t("Copy previous prescription")} />
                        <Tooltip target="#CopyForm" />
                      </span>
                    </button>

                    {/* Call Button */}
                    {!(
                      patientDetail.currentPatient?.Isdone === "true" ||
                      patientDetail.currentPatient?.P_Out === 1
                    ) && (
                      <div
                        onClick={() =>
                          handleCallButtonClick(patientDetail?.currentPatient)
                        }
                      >
                        <img
                          src={patientDetail?.currentPatient?.IsCall === 1 ? tbUncall : tbCall}
                          className="rx-tb-ico"
                          alt=""
                          title={patientDetail?.currentPatient?.IsCall === 1 ? t("Un Call") : t("Call")}
                          data-pr-tooltip={
                            patientDetail?.currentPatient?.IsCall === 1
                              ? "Un Call"
                              : "Call"
                          }
                          data-pr-position="top"
                          id={
                            patientDetail?.currentPatient?.IsCall === 1
                              ? "UnCall"
                              : "Call"
                          }
                        />
                        <Tooltip
                          target={
                            patientDetail?.currentPatient?.IsCall === 1
                              ? "#UnCall"
                              : "#Call"
                          }
                        />
                      </div>
                    )}

                    {/* Patient In/Out */}
                    {patientDetail?.currentPatient?.P_In === 1 &&
                    patientDetail?.currentPatient?.P_Out === 0 ? (
                      <span onClick={getOutPatientAPI}>
                        <img src={tbOutPatient} className="rx-tb-ico" alt="" data-pr-tooltip={translateIfKnown(t, "Out Patient")} data-pr-position="top" id="OutPatient" title={t("Out Patient")} />
                        <Tooltip target="#OutPatient" />
                      </span>
                    ) : patientDetail?.currentPatient?.P_In === 0 ? (
                      <span
                        onClick={() =>
                          getUpdateInAPI(patientDetail?.currentPatient)
                        }
                      >
                        <img src={tbInPatient} className="rx-tb-ico" alt="" data-pr-tooltip={translateIfKnown(t, "In Patient")} data-pr-position="top" id="InPatient" title={t("In Patient")} />
                        <Tooltip target="#InPatient" />
                      </span>
                    ) : null}

                    {/* Hold Button */}
                    <span onClick={getHoldAPID}>
                      <img src={tbHold} className="rx-tb-ico" alt="" data-pr-tooltip={translateIfKnown(t, "Hold")} data-pr-position="top" id="hold" title={t("Hold")} />
                      <Tooltip target="#hold" />
                    </span>

                    {/* Speech to Text */}
                    <span onClick={toggleListening}>
                      <img src={tbMic}
                        className={`rx-tb-ico ${isListening ? "rx-tb-ico--live" : ""}`}
                        alt=""
                        data-pr-tooltip={translateIfKnown(t, "Speech To Text")}
                        data-pr-position="top"
                        id="TTS"
                      title={t("Speech To Text")} />
                      <Tooltip target="#TTS" />
                    </span>

                    {/* File Open/Close */}
                    {patientDetail?.currentPatient?.IsFileOpen === 0 ? (
                      <span
                        onClick={() =>
                          handleFileClosed(patientDetail?.currentPatient)
                        }
                      >
                        <img src={tbFileClosed} className="rx-tb-ico" alt="" data-pr-tooltip={translateIfKnown(t, "File Closed")} data-pr-position="top" id="FileClosed" title={t("File Closed")} />
                        <Tooltip target="#FileClosed" />
                      </span>
                    ) : (
                      <span
                        onClick={() =>
                          handleFileOpen(patientDetail?.currentPatient)
                        }
                      >
                        <img src={tbFileOpen} className="rx-tb-ico" alt="" data-pr-tooltip={translateIfKnown(t, "File Open")} data-pr-position="top" id="FileOpen" title={t("File Open")} />
                        <Tooltip target="#FileOpen" />
                      </span>
                    )}

                    {/* Draft Button */}
                    <span onClick={handleSavePrescriptionDraft}>
                      <img src={tbDraft} className="rx-tb-ico" alt="" data-pr-tooltip={translateIfKnown(t, "Draft")} data-pr-position="top" id="SaveDraft" title={t("Save Draft")} />
                      <Tooltip target="#SaveDraft" />
                    </span>

                    {/* Clear Form */}
                    <span onClick={handleClearForm}>
                      <img src={tbClear} className="rx-tb-ico" alt="" data-pr-tooltip={translateIfKnown(t, "Clear")} data-pr-position="top" id="ClearForm" title={t("Clear Form")} />
                      <Tooltip target="#ClearForm" />
                    </span>

                    {/* Email & SMS */}
                    <span onClick={() => handleEmailModalOpen("Send Email")}>
                      <img src={tbMail} className="rx-tb-ico" alt="" data-pr-tooltip={translateIfKnown(t, "Send Mail")} data-pr-position="top" id="SendMail" title={t("Send Mail")} />
                      <Tooltip target="#SendMail" />
                    </span>

                    <span onClick={() => handleSMSModalOpen("Send SMS")}>
                      <img src={tbDocument} className="rx-tb-ico" alt="" data-pr-tooltip={translateIfKnown(t, "Send Document")} data-pr-position="top" id="SendSMS" title={t("Send Document")} />
                      <Tooltip target="#SendSMS" />
                    </span>

                    {/* Video Call */}
                    {patientDetail?.currentPatient?.IsTeleconsulation === 1 && (
                      <span onClick={handleVideoPopupOpen}>
                        <img src={tbVideo} className="rx-tb-ico" alt="" data-pr-tooltip={translateIfKnown(t, "Video Call — opens Meet in a new tab; switch back to this tab and the call floats on top (Picture-in-Picture)")} data-pr-position="top" id="VideoCall" title={t("Video Call")} />
                        <Tooltip target="#VideoCall" />
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {type === "Emergency" && (
            <>
              <div className="col"></div>
              <div className="col-auto">
                <div className="px-1 ml-3 d-flex">
                  <span>
                    {isMobile && (
                      <>
                        <Tooltip
                          target={`#DextopView`}
                          position="top"
                          content={"Is Prescription Preview"}
                          event="focus"
                          className="ToolTipCustom"
                        />
                        <input
                          type="checkbox"
                          name=""
                          className="mt-1 mr-1"
                          id="DextopView"
                          checked={isDesktop}
                          onChange={(e) => {
                            setIsDesktop(e.target.checked);
                          }}
                        />
                      </>
                    )}
                  </span>

                  <span onClick={handleSavePrescriptionDraft}>
                    <img src={tbDraft} className="rx-tb-ico" alt="" data-pr-tooltip={translateIfKnown(t, " Draft")} data-pr-position="top" id="SaveDraft" title={t("Save Draft")} />
                    <Tooltip target={"#SaveDraft"} />
                  </span>

                  <span onClick={handleClearForm}>
                    <img src={tbClear} className="rx-tb-ico" alt="" data-pr-tooltip={translateIfKnown(t, "Clear")} data-pr-position="top" id="ClearForm" title={t("Clear Form")} />
                    <Tooltip target={"#ClearForm"} />
                  </span>

                  <span onClick={handleSavePriscciptionForm}>
                    <img src={tbSave} className="rx-tb-ico" alt="" data-pr-tooltip={translateIfKnown(t, "Save")} data-pr-position="top" id="SaveForm" title={t("Save & Preview")} />
                    <Tooltip target={"#SaveForm"} />
                  </span>

                  <span onClick={DoctorPrescriptionPrint}>
                    <img src={tbPrint} className="rx-tb-ico" alt="" data-pr-tooltip={translateIfKnown(t, "Preview")} data-pr-position="top" id="Preview" title={t("Print / Preview")} />
                    <Tooltip target={"#Preview"} />
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {showRegDocs && (
        <RegistrationDocumentsModal
          visible={showRegDocs}
          setVisible={setShowRegDocs}
          patient={patientDetail?.currentPatient}
        />
      )}

      {openVideoPopup.isShow && (
        <VideoCallModal
          visible={openVideoPopup}
          setVisible={setOpenVideoPopup}
          Header={t("Online Meeting URL")}
          modalWidth={"100%"}
          footer={<></>}
        >
          <iframe
            allow="camera; microphone; fullscreen; speaker; display-capture"
            src={`https://projectvedio.yourvideo.live/host/Njc2YWEzZWFjOTBmZGM1ZTg4ODQzNmI1LTY3NmFhMzY1NWZkYzU5ZjM1YjAyNzAzMw==?landing=yes&name=${patientDetail?.currentPatient?.DName}`}
            width="100%"
            // height="100vh"
            frameBorder="0"
            allowFullScreen
            title={t("Online Meeting")}
            style={{ height: "100vh" }}
          ></iframe>
        </VideoCallModal>
      )}

      <SlideScreen
        visible={visible}
        setVisible={() => {
          setVisible(false);
        }}
      >
        <PrintDesign
          loadSaveDataPrisciption={loadSaveData}
          patientDetail={patientDetail?.currentPatient}
          prescription={prescription}
        />
      </SlideScreen>
    </>
  );
};

export default UserInfoPedia;
