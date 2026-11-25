import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import Heading from "../../../components/UI/Heading";
import Input from "../../../components/formComponent/Input";
import ReactSelect from "../../../components/formComponent/ReactSelect";
import Tables from "../../../components/UI/customTable";
import { GetBindAllDoctorConfirmation } from "../../../store/reducers/common/CommonExportFunction";
import {
  AddIPDDoctor,
  GetIPDPatientDoctors,
  RemoveIPDDoctor,
} from "../../../networkServices/IPDAdditionalDoctorApi";
import { notify } from "../../../utils/utils";

/* IPD > Add Doctor (/ipd-add-doctor): the patient was admitted under one doctor and a few
   days later another doctor is to be added. The admitting doctor stays as it is; the added
   one goes into f_multipledoctor_ipd, which the IPD prints read, so both show on the print.
   Also the IPD frame tab "Add Doctor" (components/FrameMenu/AddDoctor): there `data` is the
   selected admission, so it loads straight away and the search is not shown. */
const IPDAddDoctor = ({ data }) => {
  const frameTransactionID = Number(data?.transactionID || data?.TransactionID || 0);
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { GetBindAllDoctorConfirmationData } = useSelector(
    (state) => state.CommonSlice,
  );

  const [searchText, setSearchText] = useState("");
  const [patient, setPatient] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [doctor, setDoctor] = useState(null);

  useEffect(() => {
    if (!GetBindAllDoctorConfirmationData?.length)
      dispatch(GetBindAllDoctorConfirmation({ Department: "All" }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (frameTransactionID) handleSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frameTransactionID]);

  const handleSearch = async () => {
    if (!frameTransactionID && !searchText?.trim()) {
      notify(t("Please enter IPD No. / UHID"), "warn");
      return;
    }
    const res = await GetIPDPatientDoctors(searchText.trim(), frameTransactionID);
    if (res?.success) {
      setPatient(res?.data?.patient || null);
      setDoctors(res?.data?.doctors || []);
      setDoctor(null);
    } else {
      setPatient(null);
      setDoctors([]);
      notify(res?.message || t("No IPD admission found"), "error");
    }
  };

  const isAdmitted = patient?.Status === "IN";

  const handleAdd = async () => {
    if (!patient) return;
    if (!doctor?.value) {
      notify(t("Please select a doctor"), "error");
      return;
    }
    if (doctors.some((d) => String(d?.DoctorID) === String(doctor.value))) {
      notify(t("This doctor is already added for the patient"), "error");
      return;
    }
    const res = await AddIPDDoctor({
      transactionID: Number(patient?.TransactionID) || 0,
      doctorID: Number(doctor.value) || 0,
    });
    if (res?.success) {
      notify(res?.message, "success");
      setDoctors(res?.data || []);
      setDoctor(null);
    } else {
      notify(res?.message || t("Doctor not added"), "error");
    }
  };

  const handleRemove = async (row) => {
    if (!window.confirm(`${t("Remove")} ${row?.DoctorName}?`)) return;
    const res = await RemoveIPDDoctor({
      id: Number(row?.ID) || 0,
      transactionID: Number(patient?.TransactionID) || 0,
    });
    if (res?.success) {
      notify(res?.message, "success");
      setDoctors(res?.data || []);
    } else {
      notify(res?.message || t("Something went wrong"), "error");
    }
  };

  const info = (label, value) => (
    <div className="col-xl-2 col-md-3 col-sm-4 col-6 mb-2">
      <div style={{ fontSize: "11px", fontWeight: 600, color: "#6c757d" }}>{label}</div>
      <div style={{ fontSize: "13px", fontWeight: 600 }}>{value || "-"}</div>
    </div>
  );

  const thead = [
    { name: t("S.No."), width: "4%" },
    t("Doctor Name"),
    t("Specialization"),
    t("Type"),
    t("Added On"),
    t("Added By"),
    { name: t("Remove"), width: "6%" },
  ];

  return (
    <div className="card border">
      {!frameTransactionID && <Heading isBreadcrumb={true} />}
      {!frameTransactionID && (
      <div className="row m-2 pt-2 align-items-center">
        <Input
          className="form-control"
          lable={t("IPD No. / UHID")}
          placeholder=" "
          id="AddDoctorSearch"
          name="searchText"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          respclass="col-xl-3 col-md-4 col-sm-6 col-12"
        />
        <div className="col-xl-1 col-md-2 col-sm-3 col-6">
          <button className="btn btn-sm btn-primary w-100" onClick={handleSearch}>
            {t("Search")}
          </button>
        </div>
      </div>
      )}

      {patient && (
        <>
          <Heading title={t("Patient Details")} />
          <div className="row m-2">
            {info(t("IPD No."), patient?.IPDNo)}
            {info(t("UHID"), patient?.PatientID)}
            {info(t("Patient Name"), patient?.PName)}
            {info(t("Age/Gender"), patient?.AgeSex)}
            {info(t("Admit Date"), patient?.AdmitDate)}
            {info(t("Admitted Under"), patient?.DoctorName)}
            {info(t("Room"), patient?.RoomName)}
            {info(t("Panel"), patient?.PanelName)}
            {info(
              t("Status"),
              isAdmitted ? t("Admitted") : `${t("Discharged")} ${patient?.DischargeDate || ""}`,
            )}
          </div>

          <Heading title={t("Add Doctor")} />
          {isAdmitted ? (
            <div className="row m-2 align-items-center">
              <ReactSelect
                placeholderName={t("Select Doctor")}
                searchable={true}
                respclass="col-xl-3 col-md-4 col-sm-6 col-12"
                id="AddDoctorID"
                name="doctor"
                value={doctor?.value || ""}
                handleChange={(name, value) => setDoctor(value || null)}
                dynamicOptions={(GetBindAllDoctorConfirmationData || [])
                  .filter(
                    (item) =>
                      !doctors.some((d) => String(d?.DoctorID) === String(item?.DoctorID)),
                  )
                  .map((item) => ({ label: item?.Name, value: item?.DoctorID }))}
                requiredClassName="required-fields"
              />
              <div className="col-xl-1 col-md-2 col-sm-3 col-6">
                <button className="btn btn-sm btn-success w-100" onClick={handleAdd}>
                  {t("Add")}
                </button>
              </div>
            </div>
          ) : (
            <div className="m-2 text-danger" style={{ fontSize: "13px" }}>
              {t("Patient is discharged - doctor can be added only while the patient is admitted.")}
            </div>
          )}

          <Tables
            thead={thead}
            tbody={doctors.map((row, index) => ({
              sno: index + 1,
              DoctorName: row?.DoctorName,
              Specialization: row?.Specialization,
              Type: Number(row?.IsPrimary) === 1 ? t("Admitted Under") : t("Additional"),
              AddedOn: row?.AddedOn,
              AddedBy: row?.AddedBy,
              Remove:
                isAdmitted && Number(row?.CanRemove) === 1 ? (
                  <i
                    className="fa fa-trash text-danger"
                    style={{ cursor: "pointer" }}
                    title={t("Remove")}
                    onClick={() => handleRemove(row)}
                  />
                ) : (
                  ""
                ),
            }))}
            style={{ maxHeight: "50vh" }}
          />
        </>
      )}
    </div>
  );
};

export default IPDAddDoctor;
