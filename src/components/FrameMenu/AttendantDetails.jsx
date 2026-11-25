import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import moment from "moment";
import Heading from "../UI/Heading";
import Input from "../formComponent/Input";
import ReactSelect from "../formComponent/ReactSelect";
import DatePicker from "../formComponent/DatePicker";
import Tables from "../UI/customTable";
import { notify } from "../../utils/ustil2";
import CustomModalAlert from "../formComponent/CustomModalAlert";
import {
  IPDAttendantAvailableBeds,
  IPDAttendantCancel,
  IPDAttendantDischarge,
  IPDAttendantList,
  IPDAttendantRoomTypes,
  IPDAttendantSave,
  IPDAttendantVacateBed,
} from "../../networkServices/IPDAttendantApi";

/* IPD frame tab "Attendant Details": attendants (relatives staying with the
   patient) for this admission - ipd_patient_attendant via IPDAttendant API.
   An attendant can be given any available bed (the ones IPD admission offers):
   pick Room Type, then Room / Bed of that type. The API records the stay in
   patient_attender_profile (Bed Status reads it) and marks the bed occupied
   until it is vacated. With key AttendantRoomChargeItemID set, the bed also puts
   ATTENDANT CHARGES on the patient's bill (ROOM CHARGES); vacating / Discharge
   closes it at the days stayed. A discharged attendant gets no bed again. */

const toOptions = (list) => list.map((v) => ({ label: v, value: v }));
const RELATION_OPTIONS = toOptions([
  "Father",
  "Mother",
  "Husband",
  "Wife",
  "Son",
  "Daughter",
  "Brother",
  "Sister",
  "Relative",
  "Friend",
  "Other",
]);
const GENDER_OPTIONS = toOptions(["Male", "Female", "Other"]);
const ID_PROOF_OPTIONS = toOptions([
  "Aadhaar Card",
  "PAN Card",
  "Voter ID",
  "Driving Licence",
  "Passport",
  "Other",
]);

const getInitialValues = () => ({
  ID: 0,
  AttendantName: "",
  Relation: "",
  Gender: "",
  Age: "",
  MobileNo: "",
  AlternateMobileNo: "",
  IDProofType: "",
  IDProofNo: "",
  AttendantPassNo: "",
  // Single "Date" box (stored as FromDate), today by default.
  Date: new Date(),
  Address: "",
  Remark: "",
  IPDCaseTypeID: "",
  RoomID: 0,
  RoomName: "",
});

const AttendantDetails = ({ data }) => {
  const { t } = useTranslation();
  const transactionID = String(data?.transactionID || data?.TransactionID || "");
  const patientID = String(data?.patientID || data?.PatientID || "");

  const [values, setValues] = useState(getInitialValues);
  const [attendants, setAttendants] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [beds, setBeds] = useState([]);

  const loadAttendants = async () => {
    if (!transactionID) return;
    const res = await IPDAttendantList(transactionID);
    setAttendants(res?.success && Array.isArray(res?.data) ? res.data : []);
  };

  const loadRoomTypes = async () => {
    const res = await IPDAttendantRoomTypes();
    setRoomTypes(
      res?.success && Array.isArray(res?.data)
        ? res.data.map((r) => ({
            value: Number(r?.IPDCaseTypeID),
            label: `${r?.RoomType} (${Number(r?.FreeBeds) || 0})`,
          }))
        : [],
    );
  };

  // Free beds of the chosen room type; the attendant's own bed is kept in the
  // list while editing (it is occupied, so the API does not return it).
  const loadBeds = async (ipdCaseTypeID, keepBed) => {
    if (!ipdCaseTypeID) {
      setBeds([]);
      return;
    }
    const res = await IPDAttendantAvailableBeds(ipdCaseTypeID);
    const list =
      res?.success && Array.isArray(res?.data)
        ? res.data.map((b) => ({ label: b?.RoomName, value: Number(b?.RoomID) }))
        : [];
    if (keepBed?.value && !list.some((b) => b.value === keepBed.value)) {
      list.unshift(keepBed);
    }
    setBeds(list);
  };

  const reload = () => {
    loadAttendants();
    loadRoomTypes();
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactionID]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  // Mobile / age boxes take digits only.
  const handleNumberChange = (e, maxLength) => {
    const { name, value } = e.target;
    const digits = String(value ?? "").replace(/\D/g, "").slice(0, maxLength);
    setValues((prev) => ({ ...prev, [name]: digits }));
  };

  const handleSelect = (name, e) => {
    setValues((prev) => ({ ...prev, [name]: e?.value ?? "" }));
  };

  const handleRoomTypeSelect = (name, e) => {
    const ipdCaseTypeID = e?.value ?? "";
    setValues((prev) => ({ ...prev, IPDCaseTypeID: ipdCaseTypeID, RoomID: 0, RoomName: "" }));
    loadBeds(ipdCaseTypeID);
  };

  const handleBedSelect = (name, e) => {
    setValues((prev) => ({
      ...prev,
      RoomID: Number(e?.value || 0),
      RoomName: e?.label || "",
    }));
  };

  const handleReset = () => {
    setValues(getInitialValues());
    setBeds([]);
  };

  const handleSave = async () => {
    if (!values.AttendantName.trim()) {
      notify(t("Attendant Name is required"), "error");
      return;
    }
    if (!values.Relation) {
      notify(t("Relation With Patient is required"), "error");
      return;
    }
    if (!values.MobileNo || values.MobileNo.length !== 10) {
      notify(t("Enter a valid 10 digit Mobile No"), "error");
      return;
    }
    if (values.AlternateMobileNo && values.AlternateMobileNo.length !== 10) {
      notify(t("Enter a valid 10 digit Alternate Mobile No"), "error");
      return;
    }
    // A bed is required - except for a discharged attendant, who gets no bed again.
    const isDischarged = Number(values?.IsDischarged) === 1;
    if (!isDischarged && !Number(values.RoomID)) {
      notify(t("Please select Room Type and Room / Bed"), "error");
      return;
    }
    // One attendant per patient: a new one only after the current one is discharged.
    if (
      !Number(values?.ID) &&
      attendants.some((a) => Number(a?.IsDischarged) !== 1)
    ) {
      notify(
        t("Only one attendant is allowed with the patient. Discharge the current attendant first."),
        "error",
      );
      return;
    }

    const { Date: date, ...rest } = values;
    const payload = {
      ...rest,
      TransactionID: transactionID,
      PatientID: patientID,
      FromDate: date ? moment(date).format("YYYY-MM-DD") : "",
      ToDate: "",
      RoomID: Number(values.RoomID || 0),
    };
    const res = await IPDAttendantSave(payload);
    if (res?.success) {
      notify(res?.message, "success");
      handleReset();
      reload();
    } else {
      notify(res?.message || t("Attendant not saved"), "error");
    }
  };

  const handleEdit = (row) => {
    const roomID = Number(row?.RoomID || 0);
    const ipdCaseTypeID = roomID > 0 ? Number(row?.IPDCaseTypeID) : "";
    setValues({
      ...getInitialValues(),
      ...row,
      Date: row?.FromDate ? moment(row.FromDate, "YYYY-MM-DD").toDate() : null,
      IPDCaseTypeID: ipdCaseTypeID,
      RoomID: roomID,
      RoomName: row?.RoomName || "",
    });
    loadBeds(ipdCaseTypeID, roomID > 0 ? { label: row?.RoomName, value: roomID } : null);
  };

  /* Vacate / Discharge / Remove ask in the project's confirm box (CustomModalAlert), naming
     the attendant, e.g. Are you sure you want to discharge attendant "afd" (Husband)?
     "Yes" runs the action; the box closes either way (returns true). */
  const [confirmBox, setConfirmBox] = useState({ open: false, header: "", message: "", action: null });
  const attendantLabel = (row) =>
    `"${String(row?.AttendantName || "").trim()}"${row?.Relation ? ` (${row.Relation})` : ""}`;
  const askConfirm = (header, message, action) => setConfirmBox({ open: true, header, message, action });

  const runAttendantAction = async (apiCall, row, failMessage) => {
    const res = await apiCall();
    if (res?.success) {
      notify(res?.message, "success");
      if (Number(values.ID) === Number(row?.ID)) handleReset();
      reload();
    } else {
      notify(res?.message || failMessage, "error");
    }
    return true;
  };

  const handleVacate = (row) =>
    askConfirm(
      t("Vacate Bed"),
      `${t("Are you sure you want to vacate the bed of attendant")} ${attendantLabel(row)}?`,
      () => runAttendantAction(() => IPDAttendantVacateBed({ ID: row?.ID }), row, t("Bed not vacated")),
    );

  const handleDischarge = (row) =>
    askConfirm(
      t("Discharge Attendant"),
      `${t("Are you sure you want to discharge attendant")} ${attendantLabel(row)}?`,
      () => runAttendantAction(() => IPDAttendantDischarge({ ID: row?.ID }), row, t("Attendant not discharged")),
    );

  const handleRemove = (row) =>
    askConfirm(
      t("Remove Attendant"),
      `${t("Are you sure you want to remove attendant")} ${attendantLabel(row)}?`,
      () =>
        runAttendantAction(() => IPDAttendantCancel({ ID: row?.ID, CancelReason: "" }), row, t("Attendant not removed")),
    );

  const thead = [
    { name: t("S.No."), width: "4%" },
    { name: t("Date"), width: "7%" },
    { name: t("Attendant Name"), width: "11%" },
    { name: t("Relation"), width: "7%" },
    { name: t("Gender / Age"), width: "7%" },
    { name: t("Mobile No"), width: "9%" },
    { name: t("ID Proof"), width: "11%" },
    { name: t("Pass No"), width: "6%" },
    { name: t("Room Type"), width: "8%" },
    { name: t("Room / Bed"), width: "13%" },
    { name: t("Room Charge"), width: "6%" },
    { name: t("Status"), width: "8%" },
    { name: t("Address"), width: "8%" },
    { name: t("Remark"), width: "7%" },
    { name: t("Entry By"), width: "9%" },
    { name: t("Action"), width: "5%" },
  ];

  const tbody = attendants.map((row, index) => ({
    sno: index + 1,
    Date: row?.FromDateDisplay,
    AttendantName: row?.AttendantName,
    Relation: row?.Relation,
    GenderAge: [row?.Gender, row?.Age ? `${row.Age} Y` : ""]
      .filter(Boolean)
      .join(" / "),
    MobileNo: [row?.MobileNo, row?.AlternateMobileNo].filter(Boolean).join(", "),
    IDProof: [row?.IDProofType, row?.IDProofNo].filter(Boolean).join(" : "),
    AttendantPassNo: row?.AttendantPassNo,
    RoomType: row?.RoomType,
    RoomBed: row?.RoomName ? (
      <span title={row?.BedAllotDate ? `${t("Allotted")}: ${row.BedAllotDate}` : ""}>
        {row.RoomName}
        <i
          className="fa fa-sign-out pointer-cursor text-danger ml-2"
          title={t("Vacate Bed")}
          onClick={() => handleVacate(row)}
        />
      </span>
    ) : (
      <span className="text-muted">{t("Not Allotted")}</span>
    ),
    RoomCharge: Number(row?.RoomChargeAmount) > 0 ? Number(row.RoomChargeAmount).toFixed(2) : "",
    Status:
      Number(row?.IsDischarged) === 1 ? (
        <span
          className="text-danger"
          title={row?.DischargedByName ? `${t("By")}: ${row.DischargedByName}` : ""}
        >
          {t("Discharged")} {row?.DischargeDate}
        </span>
      ) : (
        <span className="text-success">{t("Admitted")}</span>
      ),
    Address: row?.Address,
    Remark: row?.Remark,
    EntryBy: [row?.EntryByName, row?.EntryDate].filter(Boolean).join(" / "),
    Action: (
      <div className="d-flex" style={{ gap: "6px" }}>
        <i
          className="fa fa-edit pointer-cursor text-primary"
          title={t("Edit")}
          onClick={() => handleEdit(row)}
        />
        {Number(row?.IsDischarged) !== 1 && (
          <i
            className="fa fa-user-times pointer-cursor text-warning"
            title={t("Discharge")}
            onClick={() => handleDischarge(row)}
          />
        )}
        <i
          className="fa fa-trash pointer-cursor text-danger"
          title={t("Remove")}
          onClick={() => handleRemove(row)}
        />
      </div>
    ),
  }));

  const col = "col-xl-2 col-md-3 col-sm-4 col-12";

  return (
    <>
      <div className="card patient_registration border">
        <Heading title={t("Attendant Details")} isBreadcrumb={false} />
        <div className="row p-2">
          <DatePicker
            className="custom-calendar"
            id="AttendantDate"
            name="Date"
            lable={t("Date")}
            placeholder=" "
            value={values.Date}
            handleChange={handleChange}
            respclass={col}
          />
          <Input
            type="text"
            className="form-control required-fields"
            id="AttendantName"
            name="AttendantName"
            value={values.AttendantName}
            onChange={handleChange}
            lable={t("Attendant Name")}
            placeholder=" "
            respclass={col}
            maxLength={150}
          />
          <ReactSelect
            placeholderName={t("Relation With Patient")}
            id="Relation"
            name="Relation"
            searchable={true}
            respclass={col}
            dynamicOptions={RELATION_OPTIONS}
            value={values.Relation}
            handleChange={handleSelect}
            requiredClassName="required-fields"
          />
          <ReactSelect
            placeholderName={t("Gender")}
            id="Gender"
            name="Gender"
            searchable={true}
            respclass={col}
            dynamicOptions={GENDER_OPTIONS}
            value={values.Gender}
            handleChange={handleSelect}
          />
          <Input
            type="text"
            className="form-control"
            id="Age"
            name="Age"
            value={values.Age}
            onChange={(e) => handleNumberChange(e, 3)}
            lable={t("Age (Years)")}
            placeholder=" "
            respclass={col}
          />
          <Input
            type="text"
            className="form-control required-fields"
            id="MobileNo"
            name="MobileNo"
            value={values.MobileNo}
            onChange={(e) => handleNumberChange(e, 10)}
            lable={t("Mobile No")}
            placeholder=" "
            respclass={col}
          />
          <Input
            type="text"
            className="form-control"
            id="AlternateMobileNo"
            name="AlternateMobileNo"
            value={values.AlternateMobileNo}
            onChange={(e) => handleNumberChange(e, 10)}
            lable={t("Alternate Mobile No")}
            placeholder=" "
            respclass={col}
          />
          <ReactSelect
            placeholderName={t("ID Proof Type")}
            id="IDProofType"
            name="IDProofType"
            searchable={true}
            respclass={col}
            dynamicOptions={ID_PROOF_OPTIONS}
            value={values.IDProofType}
            handleChange={handleSelect}
          />
          <Input
            type="text"
            className="form-control"
            id="IDProofNo"
            name="IDProofNo"
            value={values.IDProofNo}
            onChange={handleChange}
            lable={t("ID Proof No")}
            placeholder=" "
            respclass={col}
            maxLength={50}
          />
          <Input
            type="text"
            className="form-control"
            id="AttendantPassNo"
            name="AttendantPassNo"
            value={values.AttendantPassNo}
            onChange={handleChange}
            lable={t("Attendant Pass No")}
            placeholder=" "
            respclass={col}
            maxLength={50}
          />
          <ReactSelect
            placeholderName={t("Room Type")}
            id="AttendantRoomType"
            name="IPDCaseTypeID"
            searchable={true}
            respclass={col}
            dynamicOptions={roomTypes}
            value={values.IPDCaseTypeID}
            handleChange={handleRoomTypeSelect}
            showDropdownIndicator={true}
            requiredClassName={Number(values?.IsDischarged) === 1 ? "" : "required-fields"}
          />
          <ReactSelect
            placeholderName={t("Room / Bed")}
            id="AttendantRoomID"
            name="RoomID"
            searchable={true}
            respclass={col}
            dynamicOptions={beds}
            value={Number(values.RoomID) > 0 ? Number(values.RoomID) : ""}
            handleChange={handleBedSelect}
            isDisabled={!values.IPDCaseTypeID}
            showDropdownIndicator={true}
            requiredClassName={Number(values?.IsDischarged) === 1 ? "" : "required-fields"}
          />
          <Input
            type="text"
            className="form-control"
            id="Address"
            name="Address"
            value={values.Address}
            onChange={handleChange}
            lable={t("Address")}
            placeholder=" "
            respclass="col-xl-4 col-md-6 col-sm-8 col-12"
            maxLength={500}
          />
          <Input
            type="text"
            className="form-control"
            id="Remark"
            name="Remark"
            value={values.Remark}
            onChange={handleChange}
            lable={t("Remark")}
            placeholder=" "
            respclass="col-xl-4 col-md-6 col-sm-8 col-12"
            maxLength={500}
          />
          <div className="col-xl-2 col-md-3 col-sm-4 col-12 d-flex" style={{ gap: "6px" }}>
            <button className="btn btn-sm btn-primary" type="button" onClick={handleSave}>
              {Number(values.ID) > 0 ? t("Update") : t("Save")}
            </button>
            <button className="btn btn-sm btn-secondary" type="button" onClick={handleReset}>
              {t("Reset")}
            </button>
          </div>
        </div>
      </div>

      <div className="card mt-2">
        <Heading title={t("Attendant List")} isBreadcrumb={false} />
        {tbody.length > 0 ? (
          <Tables thead={thead} tbody={tbody} />
        ) : (
          <div className="p-2 text-center">{t("No attendant added")}</div>
        )}
      </div>

      {confirmBox.open && (
        <CustomModalAlert
          isOpen={confirmBox.open}
          setIsOpen={(open) => setConfirmBox((prev) => ({ ...prev, open }))}
          Header={confirmBox.header}
          component={confirmBox.message}
          handleActionItem={confirmBox.action}
          width="30vw"
        />
      )}
    </>
  );
};

export default AttendantDetails;
