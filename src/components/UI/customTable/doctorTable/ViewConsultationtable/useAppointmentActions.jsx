import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import moment from "moment";
import Modal from "../../../../modalComponent/Modal";
import OverLay from "../../../../modalComponent/OverLay";
import Input from "../../../../formComponent/Input";
import TextAreaInput from "../../../../formComponent/TextAreaInput";
import Checkbox from "../../../../formComponent/Checkbox";
import { GmailScheduleMeetingWithPatient } from "../../../../../networkServices/EDP/govindedp";
import { notify } from "../../../../../utils/ustil2";
import RPM from "../../../../../pages/doctor/OPD/RPM";

/**
 * useAppointmentActions — the "Invite patient" (Google Meet) modal and the "RPM"
 * overlay of the doctor's appointment lists, as a hook so the modern list view can
 * offer exactly the same actions as the classic PendingAppointmentPatientList
 * without touching it.
 *
 *   const { openInvite, openRpm, modals } = useAppointmentActions(rows);
 *   ... <button onClick={() => openInvite(item, index)}>Invite</button> ... {modals}
 *
 * Payload, validation and messages are the classic list's, verbatim.
 */
export default function useAppointmentActions(tbody) {
  const [t] = useTranslation();
  const [tableIndex, setTableIndex] = useState(null);
  const [inviteValues, setInviteValues] = useState({
    Subject: "Online Consultation",
    Description: "Patient consultation via Google Meet",
    MobileNo: "",
    IsLinkSendBySMS: false,
    AttendeesEmails: "",
  });
  const [inviteModal, setInviteModal] = useState({ show: false });
  const [rpmModal, setRpmModal] = useState({ show: false, patient: null, index: null });

  const handleChange = (e) => {
    if (e.target.name === "MobileNo" && e.target.value.length > 10) return;
    setInviteValues({ ...inviteValues, [e.target.name]: e.target.value });
  };

  const handleSendInvite = async () => {
    try {
      const patientData = tbody?.[tableIndex];
      const emailArr = (inviteValues?.AttendeesEmails || "").split(",").map((e) => e.trim());
      const invalidEmails = emailArr.filter((e) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
      if (invalidEmails.length || emailArr.length === 0) {
        notify(t("Invalid recipient email found"), "error");
        return;
      }
      const payload = {
        AppId: patientData?.App_ID,
        TransactionId: patientData?.TransactionID,
        DoctorId: patientData?.DoctorID,
        IsLinkSendBySMS: inviteValues?.IsLinkSendBySMS ? 1 : 0,
        MobileNo: inviteValues?.MobileNo,
        StartDateTime: moment(patientData?.AppointmentDate, "DD-MMM-YYYY hh:mm A").format("YYYY-MM-DD HH:mm:ss"),
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
      if (res?.success) setInviteModal({ show: false });
      notify(res?.message, res?.success ? "success" : "error");
    } catch (error) {
      notify(t("Something went wrong"), "error");
    }
  };

  const openInvite = (item, index) => {
    if (item?.IsTeleconsulation === 1) return;
    setTableIndex(index);
    setInviteValues((prev) => ({ ...prev, AttendeesEmails: item?.Email, MobileNo: item?.ContactNo }));
    setInviteModal({ show: true });
  };
  const openRpm = (item, index) => setRpmModal({ show: true, patient: item, index });

  const modals = (
    <>
      {inviteModal.show && (
        <Modal
          visible={inviteModal.show}
          setVisible={() => setInviteModal({ show: false })}
          modalWidth="70vw"
          Header={t("Schedule Meeting with Patient")}
          buttonName={t("Proceed")}
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
              <Checkbox
                name="IsLinkSendBySMS"
                inputId="IsLinkSendBySMS"
                checked={inviteValues?.IsLinkSendBySMS}
                onChange={() =>
                  setInviteValues({ ...inviteValues, IsLinkSendBySMS: !inviteValues?.IsLinkSendBySMS })
                }
              />
              <label htmlFor="IsLinkSendBySMS">{t("Send Invite link via SMS")}</label>
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
      {rpmModal.show && (
        <OverLay
          visible={rpmModal.show}
          setVisible={() => setRpmModal({ show: false, patient: null, index: null })}
          Header={t("Giloys RPM")}
          modalWidth={"96vw"}
        >
          <RPM
            patientDetail={{ currentPatient: rpmModal.patient, TotaltableData: tbody, index: rpmModal.index }}
            isPopup={true}
          />
        </OverLay>
      )}
    </>
  );

  return { openInvite, openRpm, modals };
}
