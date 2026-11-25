import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import moment from "moment/moment";
import {
  bindDetails_6_i_Consent_for_Extending_Storage_of_EmbryosApi,
  delete_6_i_Consent_for_Extending_Storage_of_EmbryosApi,
  print_6_i_Consent_for_Extending_Storage_of_EmbryosApi,
  save_6_i_Consent_for_Extending_Storage_of_EmbryosApi,
} from "../../networkServices/IVFApi";
import { RedirectURL } from "../../networkServices/PDFURL";
import { notify } from "../../utils/utils";
import Input from "../formComponent/Input";
import DatePicker from "../formComponent/DatePicker";
import Tables from "../UI/customTable";
import Heading from "../UI/Heading";
import Confirm from "../modalComponent/Confirm";

// Embryos are stored for ten (10) years as standard (ART Act Sec. 28(2)); extension is added on top.
const BASE_STORAGE_YEARS = 10;

const INITIAL = {
  id: "0",
  consentDate: new Date(),
  extensionPeriod: "",
  totalStoragePeriod: "",
  tankReferenceNo: "",
  remarks: "",
};

// IVF Form 6-i. Patient name / age / UHID and the consultant are not entered here - the API
// reads them from patient_master, patient_medical_history and doctor_master when printing.
const Consent_for_Extending_Storage_of_Embryos_6i = ({ patientDetail, data }) => {
  const [t] = useTranslation();
  const { VITE_DATE_FORMAT } = import.meta.env;
  const transactionID =
    patientDetail?.TransactionID ||
    patientDetail?.currentPatient?.TransactionID ||
    data?.transactionID ||
    data?.TransactionID;
  const patientID =
    patientDetail?.PatientID ||
    patientDetail?.currentPatient?.PatientID ||
    data?.patientID ||
    data?.PatientID;
  const ivfID = patientDetail?.IVFID || data?.IVFID || "";

  const [payload, setPayload] = useState(INITIAL);
  const [tableData, setTableData] = useState([]);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, item: null });

  const isEdit = payload.id && payload.id !== "0";

  const THEAD = [
    { name: t("SNo"), width: "3%" },
    { name: t("Date") },
    { name: t("Extension Period") },
    { name: t("Total Storage Period") },
    { name: t("Laboratory / Tank Ref. No.") },
    { name: t("Remarks") },
    { name: t("Entry By") },
    { name: t("Entry Date") },
    { name: t("Edit"), width: "2%" },
    { name: t("Delete"), width: "2%" },
    { name: t("Print"), width: "2%" },
    { name: t("BlankPrint"), width: "2%" },
  ];

  const fetchData = async () => {
    try {
      const response =
        await bindDetails_6_i_Consent_for_Extending_Storage_of_EmbryosApi(
          transactionID,
        );
      setTableData(response?.success ? response?.data || [] : []);
    } catch (error) {
      notify(error?.response?.data?.message || "Something went wrong", "error");
      console.error(error);
    }
  };

  useEffect(() => {
    if (transactionID) fetchData();
  }, [transactionID]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "extensionPeriod") {
      // Whole years only; total = the standard ten (10) years + extension
      const years = String(value ?? "").replace(/\D/g, "");
      setPayload((prev) => ({
        ...prev,
        extensionPeriod: years,
        totalStoragePeriod: years ? String(BASE_STORAGE_YEARS + Number(years)) : "",
      }));
      return;
    }
    setPayload((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => setPayload({ ...INITIAL, consentDate: new Date() });

  const handleSave = async () => {
    if (!transactionID || !patientID) {
      notify("Patient details not found", "error");
      return;
    }
    if (!(Number(payload.extensionPeriod) > 0)) {
      notify("Please enter the Extension Period in years", "error");
      return;
    }

    const body = {
      id: payload.id || "0",
      patientID,
      transactionID,
      ivfid: ivfID,
      consentDate: payload.consentDate
        ? moment(payload.consentDate).format("YYYY-MM-DD")
        : "",
      extensionPeriod: String(Number(payload.extensionPeriod)),
      tankReferenceNo: payload.tankReferenceNo || "",
      remarks: payload.remarks || "",
    };

    try {
      const response =
        await save_6_i_Consent_for_Extending_Storage_of_EmbryosApi(body);
      if (response?.success) {
        notify(response?.message, "success");
        resetForm();
        fetchData();
      } else {
        notify(response?.message, "error");
      }
    } catch (error) {
      notify("Something went wrong", "error");
      console.error(error);
    }
  };

  const handleEdit = (item) => {
    setPayload({
      id: String(item?.ID ?? "0"),
      consentDate: item?.ConsentDate ? moment(item.ConsentDate).toDate() : new Date(),
      extensionPeriod: item?.ExtensionPeriod ? String(item.ExtensionPeriod) : "",
      totalStoragePeriod: item?.ExtensionPeriod
        ? String(BASE_STORAGE_YEARS + Number(item.ExtensionPeriod))
        : "",
      tankReferenceNo: item?.TankReferenceNo || "",
      remarks: item?.Remarks || "",
    });
  };

  const handleDelete = async () => {
    const item = deleteConfirm.item;
    setDeleteConfirm({ show: false, item: null });
    try {
      const response =
        await delete_6_i_Consent_for_Extending_Storage_of_EmbryosApi(item?.ID);
      if (response?.success) {
        notify(response?.message, "success");
        if (String(item?.ID) === payload.id) resetForm();
        fetchData();
      } else {
        notify(response?.message, "error");
      }
    } catch (error) {
      notify("Something went wrong", "error");
      console.error(error);
    }
  };

  const handlePrint = async (item, blankPrint = 0) => {
    try {
      const response =
        await print_6_i_Consent_for_Extending_Storage_of_EmbryosApi(
          transactionID,
          item?.ID,
          blankPrint,
        );
      if (response?.success) {
        RedirectURL(response?.data?.pdfUrl);
      } else {
        notify(response?.message, "error");
      }
    } catch (error) {
      notify(error?.message || "Print error", "error");
    }
  };

  return (
    <>
      <div className="m-2 spatient_registration_card">
        <div className="patient_registration card">
          <Heading title={t("6-i - Consent for Extending Storage of Embryos")} />
          <div className="row p-2">
            <DatePicker
              placeholder={VITE_DATE_FORMAT}
              className="custom-calendar"
              lable={t("Date")}
              name="consentDate"
              id="consentDate"
              value={payload?.consentDate}
              handleChange={handleChange}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            />
            <Input
              type="text"
              className="form-control"
              lable={t("Extension Period (Years)")}
              id="extensionPeriod"
              name="extensionPeriod"
              value={payload?.extensionPeriod}
              onChange={handleChange}
              maxLength={2}
              respclass="col-xl-2 col-md-3 col-sm-6 col-12"
            />
            <Input
              type="text"
              className="form-control"
              lable={t("Total Cumulative Storage Period (Years)")}
              id="totalStoragePeriod"
              name="totalStoragePeriod"
              value={payload?.totalStoragePeriod}
              disabled={true}
              respclass="col-xl-3 col-md-4 col-sm-6 col-12"
            />
            <Input
              type="text"
              className="form-control"
              lable={t("Laboratory / Tank Reference No.")}
              id="tankReferenceNo"
              name="tankReferenceNo"
              value={payload?.tankReferenceNo}
              onChange={handleChange}
              maxLength={100}
              respclass="col-xl-3 col-md-4 col-sm-6 col-12"
            />
            <Input
              type="text"
              className="form-control"
              lable={t("Remarks")}
              id="remarks"
              name="remarks"
              value={payload?.remarks}
              onChange={handleChange}
              maxLength={500}
              respclass="col-xl-4 col-md-6 col-12"
            />
          </div>
          <div className="d-flex justify-content-end gap-2 p-2">
            <button type="button" className="btn btn-primary" onClick={handleSave}>
              {isEdit ? t("Update") : t("Save")}
            </button>
          </div>
        </div>
      </div>

      {tableData?.length > 0 && (
        <>
          <Heading title={t("History")} />
          <Tables
            thead={THEAD}
            tbody={tableData.map((item, index) => ({
              SNo: index + 1,
              Date: item?.ConsentDateDisplay || "",
              "Extension Period": item?.ExtensionPeriod || "",
              "Total Storage Period": item?.TotalStoragePeriod || "",
              "Laboratory / Tank Ref. No.": item?.TankReferenceNo || "",
              Remarks: item?.Remarks || "",
              "Entry By": item?.EnterBy || "",
              "Entry Date": item?.EnterDatetime || "",
              Edit: (
                <i
                  className="fa fa-edit p-1"
                  onClick={() => handleEdit(item)}
                  style={{ cursor: "pointer", color: "blue" }}
                  title="Edit"
                />
              ),
              Delete: (
                <i
                  className="fa fa-trash p-1"
                  onClick={() => setDeleteConfirm({ show: true, item })}
                  style={{ cursor: "pointer", color: "red" }}
                  title="Delete"
                />
              ),
              Print: (
                <i
                  className="fa fa-print p-1"
                  onClick={() => handlePrint(item)}
                  style={{ cursor: "pointer", color: "green" }}
                  title="Print"
                />
              ),
              BlankPrint: (
                <i
                  className="fa fa-print p-1"
                  onClick={() => handlePrint(item, 1)}
                  style={{ cursor: "pointer", color: "green" }}
                  title="Blank Print"
                />
              ),
            }))}
          />
        </>
      )}

      {deleteConfirm.show && (
        <Confirm
          confirmBoxvisible={deleteConfirm}
          lableMessage={t("Delete Record")}
          alertMessage={t("Are you sure you want to delete this record?")}
        >
          <div>
            <button type="button" className="modalConfirmButton" onClick={handleDelete}>
              {t("Delete")}
            </button>
            <button
              type="button"
              className="modalCancelButton"
              onClick={() => setDeleteConfirm({ show: false, item: null })}
            >
              {t("Cancel")}
            </button>
          </div>
        </Confirm>
      )}
    </>
  );
};

export default Consent_for_Extending_Storage_of_Embryos_6i;
