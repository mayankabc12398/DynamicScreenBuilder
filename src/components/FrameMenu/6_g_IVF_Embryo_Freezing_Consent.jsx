import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import moment from "moment/moment";
import {
  bindDetails_6_g_IVF_Embryo_Freezing_ConsentApi,
  delete_6_g_IVF_Embryo_Freezing_ConsentApi,
  print_6_g_IVF_Embryo_Freezing_ConsentApi,
  save_6_g_IVF_Embryo_Freezing_ConsentApi,
} from "../../networkServices/IVFApi";
import { RedirectURL } from "../../networkServices/PDFURL";
import { notify } from "../../utils/utils";
import Input from "../formComponent/Input";
import DatePicker from "../formComponent/DatePicker";
import Tables from "../UI/customTable";
import Heading from "../UI/Heading";
import Confirm from "../modalComponent/Confirm";

// IVF Form 6-g, clause 5 - Disposition Instructions (tick one).
const DISPOSITIONS = [
  { value: "Discarded", label: "Discarded" },
  {
    value: "Donated",
    label:
      "Donated to another infertile couple/woman through the ART Bank (separate donation consent applies)",
  },
  { value: "Research", label: "Donated for research as permitted under law" },
];

const INITIAL = {
  id: "0",
  consentDate: new Date(),
  treatmentCycleDate: null,
  embryoCount: "",
  dispositionInstruction: "Discarded",
  remarks: "",
};

// IVF Form 6-g. Husband / wife / consultant names are not entered here - the API reads
// them from patient_master, patient_medical_history and doctor_master when printing.
const IVF_Embryo_Freezing_Consent_6g = ({ patientDetail, data }) => {
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
    { name: t("Consent Date") },
    { name: t("Cycle Date") },
    { name: t("No. of Embryos") },
    { name: t("Disposition") },
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
        await bindDetails_6_g_IVF_Embryo_Freezing_ConsentApi(transactionID);
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
    if (!payload.embryoCount) {
      notify("Please enter Number of Embryo(s)", "error");
      return;
    }
    if (!payload.dispositionInstruction) {
      notify("Please select a Disposition Instruction", "error");
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
      treatmentCycleDate: payload.treatmentCycleDate
        ? moment(payload.treatmentCycleDate).format("YYYY-MM-DD")
        : "",
      embryoCount: payload.embryoCount || "",
      dispositionInstruction: payload.dispositionInstruction || "",
      remarks: payload.remarks || "",
    };

    try {
      const response = await save_6_g_IVF_Embryo_Freezing_ConsentApi(body);
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
      treatmentCycleDate: item?.TreatmentCycleDate
        ? moment(item.TreatmentCycleDate).toDate()
        : null,
      embryoCount: item?.EmbryoCount || "",
      dispositionInstruction: item?.DispositionInstruction || "Discarded",
      remarks: item?.Remarks || "",
    });
  };

  const handleDelete = async () => {
    const item = deleteConfirm.item;
    setDeleteConfirm({ show: false, item: null });
    try {
      const response = await delete_6_g_IVF_Embryo_Freezing_ConsentApi(item?.ID);
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
      const response = await print_6_g_IVF_Embryo_Freezing_ConsentApi(
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
          <Heading title={t("6-g - IVF_Embryo_Freezing_Consent")} />
          <div className="row p-2">
            <DatePicker
              placeholder={VITE_DATE_FORMAT}
              className="custom-calendar"
              lable={t("Consent Date")}
              name="consentDate"
              id="consentDate"
              value={payload?.consentDate}
              handleChange={handleChange}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            />
            <DatePicker
              placeholder={VITE_DATE_FORMAT}
              className="custom-calendar"
              lable={t("Treatment Cycle Date")}
              name="treatmentCycleDate"
              id="treatmentCycleDate"
              value={payload?.treatmentCycleDate}
              handleChange={handleChange}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            />
            <Input
              type="text"
              className="form-control"
              lable={t("No. of Embryo(s)")}
              id="embryoCount"
              name="embryoCount"
              value={payload?.embryoCount}
              onChange={handleChange}
              maxLength={20}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
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
              respclass="col-xl-4 col-md-6 col-sm-8 col-12"
            />
          </div>
          <div className="px-2 pb-1 fw-bold">
            {t("Disposition Instructions (select one)")}
          </div>
          <div className="row px-3 pb-2">
            {DISPOSITIONS.map((option) => (
              <div className="form-check col-12" key={option.value}>
                <input
                  className="form-check-input"
                  type="radio"
                  name="dispositionInstruction"
                  id={`disposition_${option.value}`}
                  value={option.value}
                  checked={payload?.dispositionInstruction === option.value}
                  onChange={handleChange}
                />
                <label className="form-check-label ms-2" htmlFor={`disposition_${option.value}`}>
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
              "Consent Date": item?.ConsentDateDisplay || "",
              "Cycle Date": item?.TreatmentCycleDateDisplay || "",
              "No. of Embryos": item?.EmbryoCount || "",
              Disposition: item?.DispositionInstruction || "",
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

export default IVF_Embryo_Freezing_Consent_6g;
