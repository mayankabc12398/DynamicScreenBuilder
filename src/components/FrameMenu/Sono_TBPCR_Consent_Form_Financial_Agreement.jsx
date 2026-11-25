import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import moment from "moment/moment";
import {
  bindDetails_Sono_TBPCR_Consent_Form_Financial_AgreementApi,
  delete_Sono_TBPCR_Consent_Form_Financial_AgreementApi,
  print_Sono_TBPCR_Consent_Form_Financial_AgreementApi,
  save_Sono_TBPCR_Consent_Form_Financial_AgreementApi,
} from "../../networkServices/IVFApi";
import { RedirectURL } from "../../networkServices/PDFURL";
import { notify } from "../../utils/utils";
import Input from "../formComponent/Input";
import DatePicker from "../formComponent/DatePicker";
import Tables from "../UI/customTable";
import Heading from "../UI/Heading";
import Confirm from "../modalComponent/Confirm";

const INITIAL = {
  id: "0",
  consentDate: new Date(),
  consentTime: "",
  procedures: "",
  otherProcedure: "",
  chargeType: "",
  lMPDate: null,
  pregnancyPossibility: "",
  pregnancyTestDate: null,
  pregnancyTestResult: "",
  allergy: "",
  allergyDetails: "",
  pIDHistory: "",
  pIDDetails: "",
  otherMedicalConditions: "",
  currentMedicines: "",
  patientQuestions: "",
  representativeName: "",
  representativeRelation: "",
  representativeReason: "",
  remarks: "",
};

// Sono TBPCR form. Patient / husband names, ages, mobiles, address, the doctor and the centre are
// not entered here - the API reads them from patient_master, patient_medical_history,
// doctor_master and center_master when printing.
const Sono_TBPCR_Consent_Form_Financial_Agreement_TB = ({ patientDetail, data }) => {
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
    { name: t("Time") },
    { name: t("Procedure to be Performed") },
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
      const response = await bindDetails_Sono_TBPCR_Consent_Form_Financial_AgreementApi(transactionID);
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

  const toggleMulti = (name, value) => {
    setPayload((prev) => {
      const list = (prev[name] || "").split(",").filter(Boolean);
      const next = list.includes(value)
        ? list.filter((v) => v !== value)
        : [...list, value];
      return { ...prev, [name]: next.join(",") };
    });
  };
  const resetForm = () => setPayload({ ...INITIAL, consentDate: new Date() });

  const handleSave = async () => {
    if (!transactionID || !patientID) {
      notify("Patient details not found", "error");
      return;
    }
    if (!payload.consentDate) {
      notify("Please select Date", "error");
      return;
    }
    if (!payload.procedures) {
      notify("Please enter Procedure to be Performed", "error");
      return;
    }

    const body = {
      id: payload.id || "0",
      patientID,
      transactionID,
      ivfid: ivfID,
      consentDate: moment(payload.consentDate).format("YYYY-MM-DD"),
      consentTime: payload.consentTime || "",
      procedures: payload.procedures || "",
      otherProcedure: payload.otherProcedure || "",
      chargeType: payload.chargeType || "",
      lMPDate: payload.lMPDate ? moment(payload.lMPDate).format("YYYY-MM-DD") : "",
      pregnancyPossibility: payload.pregnancyPossibility || "",
      pregnancyTestDate: payload.pregnancyTestDate ? moment(payload.pregnancyTestDate).format("YYYY-MM-DD") : "",
      pregnancyTestResult: payload.pregnancyTestResult || "",
      allergy: payload.allergy || "",
      allergyDetails: payload.allergyDetails || "",
      pIDHistory: payload.pIDHistory || "",
      pIDDetails: payload.pIDDetails || "",
      otherMedicalConditions: payload.otherMedicalConditions || "",
      currentMedicines: payload.currentMedicines || "",
      patientQuestions: payload.patientQuestions || "",
      representativeName: payload.representativeName || "",
      representativeRelation: payload.representativeRelation || "",
      representativeReason: payload.representativeReason || "",
      remarks: payload.remarks || "",
    };

    try {
      const response = await save_Sono_TBPCR_Consent_Form_Financial_AgreementApi(body);
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
      consentTime: item?.ConsentTime || "",
      procedures: item?.Procedures || "",
      otherProcedure: item?.OtherProcedure || "",
      chargeType: item?.ChargeType || "",
      lMPDate: item?.LMPDate ? moment(item.LMPDate).toDate() : null,
      pregnancyPossibility: item?.PregnancyPossibility || "",
      pregnancyTestDate: item?.PregnancyTestDate ? moment(item.PregnancyTestDate).toDate() : null,
      pregnancyTestResult: item?.PregnancyTestResult || "",
      allergy: item?.Allergy || "",
      allergyDetails: item?.AllergyDetails || "",
      pIDHistory: item?.PIDHistory || "",
      pIDDetails: item?.PIDDetails || "",
      otherMedicalConditions: item?.OtherMedicalConditions || "",
      currentMedicines: item?.CurrentMedicines || "",
      patientQuestions: item?.PatientQuestions || "",
      representativeName: item?.RepresentativeName || "",
      representativeRelation: item?.RepresentativeRelation || "",
      representativeReason: item?.RepresentativeReason || "",
      remarks: item?.Remarks || "",
    });
  };

  const handleDelete = async () => {
    const item = deleteConfirm.item;
    setDeleteConfirm({ show: false, item: null });
    try {
      const response = await delete_Sono_TBPCR_Consent_Form_Financial_AgreementApi(item?.ID);
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
      const response = await print_Sono_TBPCR_Consent_Form_Financial_AgreementApi(transactionID, item?.ID, blankPrint);
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
          <Heading title={t("Sono TBPCR Consent Form - Financial Agreement")} />
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
              lable={t("Time")}
              id="consentTime"
              name="consentTime"
              value={payload?.consentTime}
              onChange={handleChange}
              maxLength={20}
              respclass="col-xl-3 col-md-4 col-sm-6 col-12"
            />            <Input
              type="text"
              className="form-control"
              lable={t("Other Procedure")}
              id="otherProcedure"
              name="otherProcedure"
              value={payload?.otherProcedure}
              onChange={handleChange}
              maxLength={200}
              respclass="col-xl-3 col-md-4 col-sm-6 col-12"
            />            <DatePicker
              placeholder={VITE_DATE_FORMAT}
              className="custom-calendar"
              lable={t("Last Menstrual Period (LMP)")}
              name="lMPDate"
              id="lMPDate"
              value={payload?.lMPDate}
              handleChange={handleChange}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            />            <DatePicker
              placeholder={VITE_DATE_FORMAT}
              className="custom-calendar"
              lable={t("Pregnancy Test Date")}
              name="pregnancyTestDate"
              id="pregnancyTestDate"
              value={payload?.pregnancyTestDate}
              handleChange={handleChange}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            />            <Input
              type="text"
              className="form-control"
              lable={t("Pregnancy Test Result")}
              id="pregnancyTestResult"
              name="pregnancyTestResult"
              value={payload?.pregnancyTestResult}
              onChange={handleChange}
              maxLength={200}
              respclass="col-xl-3 col-md-4 col-sm-6 col-12"
            />            <Input
              type="text"
              className="form-control"
              lable={t("Allergy Details")}
              id="allergyDetails"
              name="allergyDetails"
              value={payload?.allergyDetails}
              onChange={handleChange}
              maxLength={500}
              respclass="col-xl-3 col-md-4 col-sm-6 col-12"
            />            <Input
              type="text"
              className="form-control"
              lable={t("PID Details")}
              id="pIDDetails"
              name="pIDDetails"
              value={payload?.pIDDetails}
              onChange={handleChange}
              maxLength={500}
              respclass="col-xl-3 col-md-4 col-sm-6 col-12"
            />            <Input
              type="text"
              className="form-control"
              lable={t("Other Significant Medical Conditions")}
              id="otherMedicalConditions"
              name="otherMedicalConditions"
              value={payload?.otherMedicalConditions}
              onChange={handleChange}
              maxLength={500}
              respclass="col-xl-3 col-md-4 col-sm-6 col-12"
            />            <Input
              type="text"
              className="form-control"
              lable={t("Current Medicines")}
              id="currentMedicines"
              name="currentMedicines"
              value={payload?.currentMedicines}
              onChange={handleChange}
              maxLength={500}
              respclass="col-xl-3 col-md-4 col-sm-6 col-12"
            />            <Input
              type="text"
              className="form-control"
              lable={t("Questions / Concerns raised by patient")}
              id="patientQuestions"
              name="patientQuestions"
              value={payload?.patientQuestions}
              onChange={handleChange}
              maxLength={500}
              respclass="col-xl-3 col-md-4 col-sm-6 col-12"
            />            <Input
              type="text"
              className="form-control"
              lable={t("Name of Representative")}
              id="representativeName"
              name="representativeName"
              value={payload?.representativeName}
              onChange={handleChange}
              maxLength={200}
              respclass="col-xl-3 col-md-4 col-sm-6 col-12"
            />            <Input
              type="text"
              className="form-control"
              lable={t("Relationship to Patient")}
              id="representativeRelation"
              name="representativeRelation"
              value={payload?.representativeRelation}
              onChange={handleChange}
              maxLength={100}
              respclass="col-xl-3 col-md-4 col-sm-6 col-12"
            />            <Input
              type="text"
              className="form-control"
              lable={t("Reason")}
              id="representativeReason"
              name="representativeReason"
              value={payload?.representativeReason}
              onChange={handleChange}
              maxLength={500}
              respclass="col-xl-3 col-md-4 col-sm-6 col-12"
            />            <Input
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
          <div className="px-2 pb-1 fw-bold">{t("Procedure to be Performed")}</div>
          <div className="d-flex flex-wrap gap-3 px-3 pb-2">
            {["HSG", "SSG", "Other"].map((option) => (
              <div className="form-check" key={option}>
                <input
                  className="form-check-input"
                  type="checkbox"
                  id={`procedures_${option}`}
                  checked={(payload?.procedures || "").split(",").includes(option)}
                  onChange={() => toggleMulti("procedures", option)}
                />
                <label className="form-check-label ms-2 ml-2 mr-4 mt-1" htmlFor={`procedures_${option}`}>
                  {t(option)}
                </label>
              </div>
            ))}
          </div>          <div className="px-2 pb-1 fw-bold">{t("Amount Stated Is")}</div>
          <div className="d-flex flex-wrap gap-3 px-3 pb-2">
            {["Fixed", "Estimated"].map((option) => (
              <div className="form-check" key={option}>
                <input
                  className="form-check-input"
                  type="radio"
                  name="chargeType"
                  id={`chargeType_${option}`}
                  value={option}
                  checked={payload?.chargeType === option}
                  onChange={handleChange}
                />
                <label className="form-check-label ms-2 ml-2 mr-4 mt-1" htmlFor={`chargeType_${option}`}>
                  {t(option)}
                </label>
              </div>
            ))}
          </div>          <div className="px-2 pb-1 fw-bold">{t("Possibility of Pregnancy")}</div>
          <div className="d-flex flex-wrap gap-3 px-3 pb-2">
            {["No", "Yes", "Uncertain"].map((option) => (
              <div className="form-check" key={option}>
                <input
                  className="form-check-input"
                  type="radio"
                  name="pregnancyPossibility"
                  id={`pregnancyPossibility_${option}`}
                  value={option}
                  checked={payload?.pregnancyPossibility === option}
                  onChange={handleChange}
                />
                <label className="form-check-label ms-2 ml-2 mr-4 mt-1" htmlFor={`pregnancyPossibility_${option}`}>
                  {t(option)}
                </label>
              </div>
            ))}
          </div>          <div className="px-2 pb-1 fw-bold">{t("Known Drug / Contrast / Latex Allergy")}</div>
          <div className="d-flex flex-wrap gap-3 px-3 pb-2">
            {["No", "Yes"].map((option) => (
              <div className="form-check" key={option}>
                <input
                  className="form-check-input"
                  type="radio"
                  name="allergy"
                  id={`allergy_${option}`}
                  value={option}
                  checked={payload?.allergy === option}
                  onChange={handleChange}
                />
                <label className="form-check-label ms-2 ml-2 mr-4 mt-1" htmlFor={`allergy_${option}`}>
                  {t(option)}
                </label>
              </div>
            ))}
          </div>          <div className="px-2 pb-1 fw-bold">{t("History of Pelvic Infection / PID")}</div>
          <div className="d-flex flex-wrap gap-3 px-3 pb-2">
            {["No", "Yes"].map((option) => (
              <div className="form-check" key={option}>
                <input
                  className="form-check-input"
                  type="radio"
                  name="pIDHistory"
                  id={`pIDHistory_${option}`}
                  value={option}
                  checked={payload?.pIDHistory === option}
                  onChange={handleChange}
                />
                <label className="form-check-label ms-2 ml-2 mr-4 mt-1" htmlFor={`pIDHistory_${option}`}>
                  {t(option)}
                </label>
              </div>
            ))}
          </div>          <div className="d-flex justify-content-end gap-2 p-2">
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
              "Date": item?.ConsentDateDisplay || "",
              "Time": item?.ConsentTime || "",
              "Procedure to be Performed": item?.Procedures || "",
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

export default Sono_TBPCR_Consent_Form_Financial_Agreement_TB;