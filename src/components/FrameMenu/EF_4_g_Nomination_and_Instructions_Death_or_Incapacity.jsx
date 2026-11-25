import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import moment from "moment/moment";
import {
  bindDetails_EF_4_g_Nomination_and_Instructions_Death_or_IncapacityApi,
  delete_EF_4_g_Nomination_and_Instructions_Death_or_IncapacityApi,
  print_EF_4_g_Nomination_and_Instructions_Death_or_IncapacityApi,
  save_EF_4_g_Nomination_and_Instructions_Death_or_IncapacityApi,
} from "../../networkServices/IVFApi";
import { RedirectURL } from "../../networkServices/PDFURL";
import { notify } from "../../utils/utils";
import Input from "../formComponent/Input";
import DatePicker from "../formComponent/DatePicker";
import Tables from "../UI/customTable";
import Heading from "../UI/Heading";
import Confirm from "../modalComponent/Confirm";

// Form EF-4-g - My Instructions (select one).
const INSTRUCTIONS = [
  {
    value: "Perish",
    label:
      "My oocytes should be allowed to perish (discarded) in accordance with the Centre's laboratory protocol.",
  },
  {
    value: "Research",
    label:
      "My oocytes should be donated to a research organisation registered under the ART (Regulation) Act, 2021, for research purposes only.",
  },
  {
    value: "Other",
    label: "Other instruction (please specify clearly):",
  },
];
const INITIAL = {
  id: "0",
  consentDate: new Date(),
  nomineeName: "",
  nomineeRelation: "",
  nomineeAddress: "",
  nomineeContactNo: "",
  instruction: "",
  otherInstruction: "",
  remarks: "",
};

// Form EF-4-g. Patient / husband details, ages, phones, address and the consultant are
// not entered here - the API reads them from patient_master, patient_medical_history and
// doctor_master when printing. Only the nominee and the instruction are stored.
const Nomination_and_Instructions_Death_or_Incapacity_EF4g = ({
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
    { name: t("Nominee") },
    { name: t("Relationship") },
    { name: t("Contact Number") },
    { name: t("Instruction") },
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
        await bindDetails_EF_4_g_Nomination_and_Instructions_Death_or_IncapacityApi(
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
    const body = {
      id: payload.id || "0",
      patientID,
      transactionID,
      ivfid: ivfID,
      consentDate: payload.consentDate
        ? moment(payload.consentDate).format("YYYY-MM-DD")
        : "",
      nomineeName: payload.nomineeName || "",
      nomineeRelation: payload.nomineeRelation || "",
      nomineeAddress: payload.nomineeAddress || "",
      nomineeContactNo: payload.nomineeContactNo || "",
      instruction: payload.instruction || "",
      otherInstruction:
        payload.instruction === "" ? payload.otherInstruction || "" : "",
      remarks: payload.remarks || "",
    };

    try {
      const response =
        await save_EF_4_g_Nomination_and_Instructions_Death_or_IncapacityApi(body);
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
      nomineeName: item?.NomineeName || "",
      nomineeRelation: item?.NomineeRelation || "",
      nomineeAddress: item?.NomineeAddress || "",
      nomineeContactNo: item?.NomineeContactNo || "",
      instruction: item?.Instruction || "",
      otherInstruction: item?.OtherInstruction || "",
      remarks: item?.Remarks || "",
    });
  };

  const handleDelete = async () => {
    const item = deleteConfirm.item;
    setDeleteConfirm({ show: false, item: null });
    try {
      const response =
        await delete_EF_4_g_Nomination_and_Instructions_Death_or_IncapacityApi(
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
        await print_EF_4_g_Nomination_and_Instructions_Death_or_IncapacityApi(
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
          <Heading title={t("EF - 4-g Nomination and Instructions - Death or Incapacity")} />
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
              lable={t("Name of Nominee")}
              id="nomineeName"
              name="nomineeName"
              value={payload?.nomineeName}
              onChange={handleChange}
              maxLength={200}
              respclass="col-xl-3 col-md-4 col-sm-6 col-12"
            />
            <Input
              type="text"
              className="form-control"
              lable={t("Relationship to Me")}
              id="nomineeRelation"
              name="nomineeRelation"
              value={payload?.nomineeRelation}
              onChange={handleChange}
              maxLength={100}
              respclass="col-xl-2 col-md-3 col-sm-6 col-12"
            />
            <Input
              type="text"
              className="form-control"
              lable={t("Contact Number")}
              id="nomineeContactNo"
              name="nomineeContactNo"
              value={payload?.nomineeContactNo}
              onChange={handleChange}
              maxLength={10}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            />
            <Input
              type="text"
              className="form-control"
              lable={t("Nominee Address")}
              id="nomineeAddress"
              name="nomineeAddress"
              value={payload?.nomineeAddress}
              onChange={handleChange}
              maxLength={500}
              respclass="col-xl-5 col-md-6 col-12"
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
          <div className="px-2 pb-1 fw-bold">{t("My Instructions")}</div>
          <div className="row px-3 pb-2">
            {INSTRUCTIONS.map((option) => (
              <div className="form-check col-12" key={option.value}>
                <input
                  className="form-check-input"
                  type="radio"
                  name="instruction"
                  id={`instruction_${option.value}`}
                  value={option.value}
                  checked={payload?.instruction === option.value}
                  onChange={handleChange}
                />
                <label className="form-check-label ms-2" htmlFor={`instruction_${option.value}`}>
                  {t(option.label)}
                </label>
                 {option.value === "Other" && (
        <input
          type="text"
          className="form-control form-control-sm mt-1"
          name="otherInstruction"
          value={payload?.otherInstruction ?? ""}
          onChange={handleChange}
          maxLength={500}
          disabled={payload?.instruction !== "Other"}
        />
      )}
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
              Nominee: item?.NomineeName || "",
              Relationship: item?.NomineeRelation || "",
              "Contact Number": item?.NomineeContactNo || "",
              Instruction:
                item?.Instruction === "Other"
                  ? `Other - ${item?.OtherInstruction || ""}`
                  : item?.Instruction || "",
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

export default Nomination_and_Instructions_Death_or_Incapacity_EF4g;
