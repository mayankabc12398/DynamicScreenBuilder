import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import moment from "moment/moment";
import {
  bindDetails_6_j_Consent_for_Disposal_of_Cryopreserved_EmbryosApi,
  delete_6_j_Consent_for_Disposal_of_Cryopreserved_EmbryosApi,
  print_6_j_Consent_for_Disposal_of_Cryopreserved_EmbryosApi,
  save_6_j_Consent_for_Disposal_of_Cryopreserved_EmbryosApi,
} from "../../networkServices/IVFApi";
import { RedirectURL } from "../../networkServices/PDFURL";
import { notify } from "../../utils/utils";
import Input from "../formComponent/Input";
import DatePicker from "../formComponent/DatePicker";
import Tables from "../UI/customTable";
import Heading from "../UI/Heading";
import Confirm from "../modalComponent/Confirm";

// IVF Form 6-j - Reason for Disposal (filled by the Centre on the date of disposal).
const REASONS = [
  { value: "Voluntary", label: "Voluntary / elective withdrawal." },
  {
    value: "Expiry",
    label: "Expiry of the maximum permitted storage period without renewal.",
  },
  {
    value: "NonPayment",
    label:
      "Non-payment of storage fees after due written notice, as per the Financial Agreement.",
  },
  {
    value: "Nomination",
    label:
      "Instruction on record following patient's death or incapacity, per the Nomination form.",
  },
  { value: "Other", label: "Other (please specify):" },
];

// Method of Disposal (filled by the patient on the date of the consent).
const METHODS = [
  {
    value: "Perish",
    label:
      "The embryo(s) shall be allowed to perish and be discarded in accordance with laboratory bio-medical waste protocol.",
  },
  {
    value: "Research",
    label:
      "The embryo(s) shall be donated to a research organisation registered under the ART (Regulation) Act, 2021, for research purposes only (a separate research-donation authorisation applies).",
  },
];

const INITIAL = {
  id: "0",
  consentDate: new Date(),
  embryoFrozenDate: null,
  tankReferenceNo: "",
  disposalReason: "",
  otherDisposalReason: "",
  disposalMethod: "",
  remarks: "",
};

// IVF Form 6-j. The patient block (name, age, date of birth, UHID, address, contact) and
// the consultant are not entered here - the API reads them from patient_master,
// patient_medical_history and doctor_master when printing.
const Consent_for_Disposal_of_Cryopreserved_Embryos_6j = ({
  patientDetail,
  data,
}) => {
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
    { name: t("Date Embryo(s) Were Frozen") },
    { name: t("Laboratory / Tank Ref. No.") },
    { name: t("Reason") },
    { name: t("Method") },
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
        await bindDetails_6_j_Consent_for_Disposal_of_Cryopreserved_EmbryosApi(
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
    setPayload((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => setPayload({ ...INITIAL, consentDate: new Date() });

  const handleSave = async () => {
    if (!transactionID || !patientID) {
      notify("Patient details not found", "error");
      return;
    }
    if (payload.disposalReason === "Other" && !payload.otherDisposalReason) {
      notify("Please specify the Other reason for disposal", "error");
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
      embryoFrozenDate: payload.embryoFrozenDate
        ? moment(payload.embryoFrozenDate).format("YYYY-MM-DD")
        : "",
      tankReferenceNo: payload.tankReferenceNo || "",
      disposalReason: payload.disposalReason || "",
      otherDisposalReason:
        payload.disposalReason === "Other"
          ? payload.otherDisposalReason || ""
          : "",
      disposalMethod: payload.disposalMethod || "",
      remarks: payload.remarks || "",
    };

    try {
      const response =
        await save_6_j_Consent_for_Disposal_of_Cryopreserved_EmbryosApi(body);
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
      embryoFrozenDate: item?.EmbryoFrozenDate
        ? moment(item.EmbryoFrozenDate).toDate()
        : null,
      tankReferenceNo: item?.TankReferenceNo || "",
      disposalReason: item?.DisposalReason || "",
      otherDisposalReason: item?.OtherDisposalReason || "",
      disposalMethod: item?.DisposalMethod || "Perish",
      remarks: item?.Remarks || "",
    });
  };

  const handleDelete = async () => {
    const item = deleteConfirm.item;
    setDeleteConfirm({ show: false, item: null });
    try {
      const response =
        await delete_6_j_Consent_for_Disposal_of_Cryopreserved_EmbryosApi(
          item?.ID,
        );
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
        await print_6_j_Consent_for_Disposal_of_Cryopreserved_EmbryosApi(
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
          <Heading title={t("6-j - Consent for Disposal of Cryopreserved Embryos")} />
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
            <DatePicker
              placeholder={VITE_DATE_FORMAT}
              className="custom-calendar"
              lable={t("Date Embryo(s) Were Frozen")}
              name="embryoFrozenDate"
              id="embryoFrozenDate"
              value={payload?.embryoFrozenDate}
              handleChange={handleChange}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
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

          <div className="px-2 pb-1 fw-bold">
            {t("Reason for Disposal (to be filled by the Centre on date of disposal)")}
          </div>
          <div className="row px-3 pb-2">
            {REASONS.map((option) => (
              <div className="form-check col-12" key={option.value}>
                <input
                  className="form-check-input"
                  type="radio"
                  name="disposalReason"
                  id={`disposalReason_${option.value}`}
                  value={option.value}
                  checked={payload?.disposalReason === option.value}
                  onChange={handleChange}
                />
                <label
                  className="form-check-label ms-2"
                  htmlFor={`disposalReason_${option.value}`}
                >
                  {t(option.label)}
                </label>
                {option.value === "Other" ? (
                  <input
                    type="text"
                    className="form-control form-control-sm mt-1"
                    name="otherDisposalReason"
                    value={payload?.otherDisposalReason}
                    onChange={handleChange}
                    maxLength={500}
                    disabled={payload?.disposalReason !== "Other"}
                  />
                ) : null}
              </div>
            ))}
          </div>

          <div className="px-2 pb-1 fw-bold">
            {t("Method of Disposal (to be filled by the patient on date of the consent)")}
          </div>
          <div className="row px-3 pb-2">
            {METHODS.map((option) => (
              <div className="form-check col-12" key={option.value}>
                <input
                  className="form-check-input"
                  type="radio"
                  name="disposalMethod"
                  id={`disposalMethod_${option.value}`}
                  value={option.value}
                  checked={payload?.disposalMethod === option.value} 
                  onChange={handleChange}
                />
                <label
                  className="form-check-label ms-2"
                  htmlFor={`disposalMethod_${option.value}`}
                >
                  {t(option.label)}
                </label>
              </div>
            ))}
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
              "Date Embryo(s) Were Frozen": item?.EmbryoFrozenDateDisplay || "",
              "Laboratory / Tank Ref. No.": item?.TankReferenceNo || "",
              Reason:
                item?.DisposalReason === "Other"
                  ? `Other - ${item?.OtherDisposalReason || ""}`
                  : item?.DisposalReason || "",
              Method: item?.DisposalMethod || "",
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

export default Consent_for_Disposal_of_Cryopreserved_Embryos_6j;
