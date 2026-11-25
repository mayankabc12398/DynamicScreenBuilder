import React, { useState } from "react";
import Heading from "../../../Heading";
import Tables from "../..";
import { useTranslation } from "react-i18next";
import { maxLengthChecker } from "../../../../../utils/utils";
import { Tooltip } from "primereact/tooltip";
import Modal from "../../../../modalComponent/Modal";
import OverLay from "../../../../modalComponent/OverLay";
import Input from "../../../../formComponent/Input";
import TextAreaInput from "../../../../formComponent/TextAreaInput";
import Checkbox from "../../../../formComponent/Checkbox";
import {
  GetPatientMedicineList,
  GmailScheduleMeetingWithPatient,
} from "../../../../../networkServices/EDP/govindedp";
import moment from "moment";
import { notify } from "../../../../../utils/ustil2";
import { maskValue } from "../../../../../utils/constant";
import { FaStar, FaFileMedical } from "react-icons/fa";
import FlowsheetModel from "../../../../modalComponent/Utils/FlowsheetModel";
import MedicationCalendar from "../../../../modalComponent/Utils/MedicationCalendar";
import PatientSummaryCalendar from "../../../../modalComponent/Utils/PatientSummaryCalendar";
import RPM from "../../../../../pages/doctor/OPD/RPM";
import { GiMedicines } from "react-icons/gi";
import { FaKitMedical } from "react-icons/fa6";
const PendingAppointmentPatientList = ({
  thead,
  tbody,
  handleCallButtonClick,
  handlePatientSelect,
  start,
  getUpdateInAPI,
  showFlowSheet,
  showMedicationCalendar,
  showNotesModal,
  setShowFlowSheet,
  setShowMedicationCalendar,
  setShowNotesModal,
  selectedPatient,
  setSelectedPatient,
  // fin_global_resources switches (see ViewConsultation): the Invite Patient and RPM columns are
  // left out unless their flag is 1. The header list and these row cells must change together.
  showInvitePatient = false,
  showRPM = false,
}) => {
  const [t] = useTranslation();
  const [tableIndex, setTableIndex] = useState(null);
  /* const [showFlowSheet, setShowFlowSheet] = useState(false);
  const [showMedicationCalendar, setShowMedicationCalendar] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false); */

  const [inviteValues, setInviteValues] = useState({
    Subject: "Online Consultation",
    Description: "Patient consultation via Google Meet",
    MobileNo: "",
    IsLinkSendBySMS: false,
    AttendeesEmails: "",
  });
  const handleSendInvite = async () => {
    try {
      const patientData = tbody?.[tableIndex];
      const emailArr = (inviteValues?.AttendeesEmails || "")
        .split(",")
        .map((e) => e.trim());

      const invalidEmails = emailArr.filter(
        (e) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e),
      );

      if (invalidEmails.length || emailArr.length === 0) {
        notify(t("Invalid recipient email found"), "error");
        return; // stop API call
      }
      debugger;
      const payload = {
        AppId: patientData?.App_ID,
        TransactionId: patientData?.TransactionID,
        DoctorId: patientData?.DoctorID,
        IsLinkSendBySMS: inviteValues?.IsLinkSendBySMS ? 1 : 0,
        MobileNo: inviteValues?.MobileNo,
        StartDateTime: moment(
          patientData?.AppointmentDate,
          "DD-MMM-YYYY hh:mm A",
        ).format("YYYY-MM-DD HH:mm:ss"),
        EndDateTime: moment(patientData?.AppointmentDate, "DD-MMM-YYYY hh:mm A")
          .add(30, "minutes")
          .format("YYYY-MM-DD HH:mm:ss"),
        Subject: inviteValues?.Subject,
        Description: inviteValues?.Description,
        Location: "",
        Organizer: "",
        Link: "",
        AttendeesEmails: emailArr || [],
      };

      const res = await GmailScheduleMeetingWithPatient(payload);
      if (res?.success) {
        setModalHandlerState({
          show: false,
        });
      }

      notify(res?.message, res?.success ? "success" : "error");
    } catch (error) {
      notify(t("Something went wrong"), "error");
    }
  };
  const getRowClass = (val, index) => {
    let data = tbody?.[index];
    if (Number(data?.IsDoctorConsultancyUrgent) === 1) {
      return "color-indicator-20-bg";
    } else if (data?.TemperatureRoom === 1) {
      return "color-indicator-3-bg";
    } else if (data?.IsView === 1) {
      return "color-indicator-16-bg";
    } else if (data?.Hold === 1) {
      return "color-indicator-5-bg";
    } /*  else if (data?.PatientType === "VIP") {
      return "color-indicator-vip-bg";
    } */
  };
  const handleChange = (e) => {
    if (e.target.name === "MobileNo" && e.target.value.length > 10) return;
    setInviteValues({
      ...inviteValues,
      [e.target.name]: e.target.value,
    });
  };
  const handleInvitePatient = (item, index) => {
    setTableIndex(index);
    setModalHandlerState({
      header: t("Schedule Meeting with Patient"),
      show: true,
      size: "70vw",
      buttonName: t("Proceed"),
      // component: <>hello</>,
      // footer: <></>,
    });
    setInviteValues({
      ...inviteValues,
      AttendeesEmails: item?.Email,
      MobileNo: item?.ContactNo,
    });
  };
  const [modalHandlerState, setModalHandlerState] = useState({
    header: null,
    show: false,
    size: null,
    component: null,
    footer: null,
  });
  const [rpmModal, setRpmModal] = useState({
    show: false,
    patient: null,
    index: null,
  });

  return (
    <>
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
          buttonName={modalHandlerState?.buttonName}
          handleAPI={handleSendInvite}
        >
          <div className="row">
            <Input
              lable={t("Receipient Emails")}
              type="text"
              className="form-control"
              placeholder={" "}
              onChange={handleChange}
              name="AttendeesEmails"
              value={inviteValues?.AttendeesEmails}
              respclass={"col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12"}
            />
            <Input
              lable={t("Subject")}
              type="text"
              className="form-control"
              placeholder={" "}
              onChange={handleChange}
              name="Subject"
              value={inviteValues?.Subject}
              respclass={"col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12"}
            />
            <TextAreaInput
              name="Description"
              value={inviteValues?.Description}
              respclass={"col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12"}
              lable={t("Description")}
              onChange={handleChange}
            />
            <div className="row px-4">
              {console.log(inviteValues, "inviteValues")}
              <Checkbox
                name="IsLinkSendBySMS"
                inputId="IsLinkSendBySMS"
                checked={inviteValues?.IsLinkSendBySMS}
                onChange={(e) => {
                  debugger;
                  setInviteValues({
                    ...inviteValues,
                    IsLinkSendBySMS: inviteValues?.IsLinkSendBySMS
                      ? false
                      : true,
                  });
                }}
              />
              <label htmlFor="IsLinkSendBySMS">
                {t("Send Invite link via SMS")}
              </label>
              <Input
                lable={t("Mobile No.")}
                type="number"
                className="form-control"
                placeholder={" "}
                onChange={handleChange}
                name="MobileNo"
                value={inviteValues?.MobileNo}
                respclass={"col-xl-5 col-lg-5 col-md-5 col-sm-6 col-6"}
              />
            </div>
          </div>
        </Modal>
      )}
      {rpmModal?.show && (
        <OverLay
          visible={rpmModal?.show}
          setVisible={() =>
            setRpmModal({
              show: false,
              patient: null,
              index: null,
            })
          }
          Header={t("Giloys RPM")}
          modalWidth={"96vw"}
        >
          <RPM
            patientDetail={{
              currentPatient: rpmModal?.patient,
              TotaltableData: tbody,
              index: rpmModal?.index,
            }}
            isPopup={true}
          />
        </OverLay>
      )}
      <Tables
        getRowClass={getRowClass}
        thead={thead}
        tbody={tbody?.map((item, index) => ({
          colorcode:
            Number(item?.IsDoctorConsultancyUrgent) === 1 ? "#ff6b6b" : "",
          "Sr.No.": <span>{index + 1}</span>,
          flowSheet: (
            <div className="">
              <button
                className="btn btn-sm btn-success me-2"
                onClick={() => {
                  setSelectedPatient(item);
                  setShowFlowSheet(true);
                }}
              >
                <FaFileMedical className="pointer-cursor" />
              </button>
              <button
                className="btn btn-sm btn-success mx-2"
                onClick={() => {
                  setShowMedicationCalendar(item);
                }}
              >
                <GiMedicines />
              </button>
              <button
                className="btn btn-sm btn-success mx-2"
                onClick={() => {
                  setShowNotesModal(item);
                }}
              >
                <FaKitMedical />
              </button>
            </div>
          ),
          ...(showInvitePatient
            ? {
                invite: (
                  <button
                    className={`btn btn-success ${item?.IsTeleconsulation === 1 ? "disabled" : ""}`}
                    onClick={() => {
                      if (item?.IsTeleconsulation === 1) return;
                      handleInvitePatient(item, index);
                    }}
                  >
                    {item?.IsTeleconsulation === 1 ? t("Invited") : t("Invite")}
                  </button>
                ),
              }
            : {}),
          ...(showRPM
            ? {
                RPM: (
                  <button
                    className="btn btn-sm text-white"
                    onClick={() =>
                      setRpmModal({
                        show: true,
                        patient: item,
                        index,
                      })
                    }
                    style={{ backgroundColor: "#0b8f08" }}
                  >
                    {t("RPM")}
                  </button>
                ),
              }
            : {}),

          // AppointmentDate: item?.AppointmentDate,
          // AppointmentNo: item?.AppNo,
          // PanelName: item?.PanelName,
          IsCall: (
            <button
              className="btn btn-sm text-white "
              onClick={() => handleCallButtonClick(item, index, "Pending")}
              style={{
                backgroundColor: item?.IsCall === 1 ? "gray" : "",
                borderColor: "#f8f988",
              }}
            >
              {item?.IsCall === 1 ? t("UnCall") : t("Call")}
            </button>
          ),
          MRNo:
            item?.PatientType === "VIP" ? (
              <>
                <span className="">{item?.MRNo}</span>
                <span className="">
                  <FaStar className="text-warning" />
                </span>
              </>
            ) : (
              item?.MRNo
            ),
          tokenno: (
            <>
              {item?.GenralTokenNo && item?.GenralTokenNo != 0 && (
                <div className="text-center">
                  <span className="bg-success px-3 py-2 rounded-circle">
                    {item?.GenralTokenNo}
                  </span>
                </div>
              )}
            </>
          ),
          transNo: item?.TransNo,
          Pname:
            item?.PatientType === "VIP" ? (
              <span className="masked-text-value">
                {maskValue(item?.Pname)}
              </span>
            ) : (
              item?.Pname
            ),
          Age:
            item?.PatientType === "VIP" ? (
              <span className="masked-text-value">
                {maskValue(`${item?.Age}/${item?.Sex}`)}
              </span>
            ) : (
              <span>
                {item?.Age}/{item?.Sex}
              </span>
            ),
          Doctor: (
            <>
              <>
                <span id={`doctor-tooltip-${index}`}>
                  {maxLengthChecker(item?.DName, 30)}
                </span>
                {item?.DName?.length > 10 && (
                  <Tooltip
                    target={`#doctor-tooltip-${index}`}
                    content={item?.DName}
                  />
                )}
              </>
            </>
          ),
          RegDate: item?.RegDate,

          AppDate: item?.AppointmentDate,

          CallDate: item?.CallDate,

          StartDate: item?.StartDa,

          EndDate: item?.EndDate,
          ...(showInvitePatient
            ? {
                invite: (
                  <button
                    className={`btn btn-success ${item?.IsTeleconsulation === 1 ? "disabled" : ""}`}
                    onClick={() => {
                      if (item?.IsTeleconsulation === 1) return;
                      handleInvitePatient(item, index);
                    }}
                  >
                    {item?.IsTeleconsulation === 1 ? t("Invited") : t("Invite")}
                  </button>
                ),
              }
            : {}),
          ...(showRPM
            ? {
                RPM: (
                  <button
                    className="btn btn-sm text-white"
                    onClick={() =>
                      setRpmModal({
                        show: true,
                        patient: item,
                        index,
                      })
                    }
                    style={{ backgroundColor: "#0b8f08" }}
                  >
                    {t("RPM")}
                  </button>
                ),
              }
            : {}),

          // AppointmentDate: item?.AppointmentDate,
          // AppointmentNo: item?.AppNo,
          // PanelName: item?.PanelName,
          IsCall: (
            <button
              className="btn btn-sm text-white "
              onClick={() => handleCallButtonClick(item, index, "Pending")}
              style={{
                backgroundColor: item?.IsCall === 1 ? "gray" : "",
                borderColor: "#f8f988",
              }}
            >
              {item?.IsCall === 1 ? t("UnCall") : t("Call")}
            </button>
          ),
          // SRS-2026-0057 point 1. Restored. A called patient had no way back
          // into their consultation - this cell, its "In" header and the
          // handlePatientSelect prop had all been commented out.
          //
          // Call still marks the patient In and opens the consultation, so this
          // button is the re-entry path: it reopens an already-called patient
          // without an UnCall/Call round trip (which would wipe CallNo, IsCall
          // and P_In and re-queue them). For a patient already In it opens
          // straight away without re-stamping InTime.
          //
          // Disabled until the patient is called, mirroring the API:
          // ViewConsultation/UpdateIn refuses unless IsCall = 1.
          //
          // Keep this as the LAST key on the row object - the table renders body
          // columns in object-key order against thead, and "In" is the last
          // column of SearchThead.
          P_In: (
            <button
              className="btn btn-sm text-white w-100"
              onClick={() => handlePatientSelect(item, index, "Pending")}
              disabled={item?.IsCall !== 1}
              title={
                item?.IsCall !== 1
                  ? t("Call the patient first", {
                      defaultValue: "Call the patient first",
                    })
                  : t("Open consultation", {
                      defaultValue: "Open consultation",
                    })
              }
              style={{
                backgroundColor: item?.P_In === 1 ? "gray" : "",
                cursor: item?.IsCall !== 1 ? "not-allowed" : "pointer",
              }}
            >
              {t("In", { defaultValue: "In" })}
            </button>
          ),
        }))}
        tableHeight={"tableHeight scrollView"}
        style={{ height: "auto" }}
      />
    </>
  );
};

export default PendingAppointmentPatientList;
