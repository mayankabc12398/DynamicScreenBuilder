import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import moment from "moment/moment";
import {
  bindDetails_IUI_1_d_IUI_Consent_Form_Donor_Semen_for_DonorApi,
  delete_IUI_1_d_IUI_Consent_Form_Donor_Semen_for_DonorApi,
  print_IUI_1_d_IUI_Consent_Form_Donor_Semen_for_DonorApi,
  save_IUI_1_d_IUI_Consent_Form_Donor_Semen_for_DonorApi,
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
  donorName: "",
  donorFatherName: "",
  donorAge: "",
  donorAadharNo: "",
  donorAddress: "",
  donorOccupation: "",
  donorMaritalStatus: "",
  remarks: "",
};

// IUI Form 1-d. Patient / husband names, ages, mobiles, address, the doctor and the centre are
// not entered here - the API reads them from patient_master, patient_medical_history,
// doctor_master and center_master when printing.
const IUI_Consent_Form_Donor_Semen_for_Donor_1d = ({ patientDetail, data }) => {
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
    { name: t("Name of Donor") },
    { name: t("S/o (Father's Name)") },
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
      const response = await bindDetails_IUI_1_d_IUI_Consent_Form_Donor_Semen_for_DonorApi(transactionID);
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
    if (!payload.consentDate) {
      notify("Please select Consent Date", "error");
      return;
    }
    if (!payload.donorName) {
      notify("Please enter Name of Donor", "error");
      return;
    }

    const body = {
      id: payload.id || "0",
      patientID,
      transactionID,
      ivfid: ivfID,
      consentDate: moment(payload.consentDate).format("YYYY-MM-DD"),
      donorName: payload.donorName || "",
      donorFatherName: payload.donorFatherName || "",
      donorAge: payload.donorAge || "",
      donorAadharNo: payload.donorAadharNo || "",
      donorAddress: payload.donorAddress || "",
      donorOccupation: payload.donorOccupation || "",
      donorMaritalStatus: payload.donorMaritalStatus || "",
      remarks: payload.remarks || "",
    };

    try {
      const response = await save_IUI_1_d_IUI_Consent_Form_Donor_Semen_for_DonorApi(body);
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
      donorName: item?.DonorName || "",
      donorFatherName: item?.DonorFatherName || "",
      donorAge: item?.DonorAge || "",
      donorAadharNo: item?.DonorAadharNo || "",
      donorAddress: item?.DonorAddress || "",
      donorOccupation: item?.DonorOccupation || "",
      donorMaritalStatus: item?.DonorMaritalStatus || "",
      remarks: item?.Remarks || "",
    });
  };

  const handleDelete = async () => {
    const item = deleteConfirm.item;
    setDeleteConfirm({ show: false, item: null });
    try {
      const response = await delete_IUI_1_d_IUI_Consent_Form_Donor_Semen_for_DonorApi(item?.ID);
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
      const response = await print_IUI_1_d_IUI_Consent_Form_Donor_Semen_for_DonorApi(transactionID, item?.ID, blankPrint);
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
          <Heading title={t("IUI Form 1-d (IUI Consent Form – Donor Semen for donor)")} />
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
            <Input
              type="text"
              className="form-control required-fields"
              lable={t("Name of Donor")}
              id="donorName"
              name="donorName"
              value={payload?.donorName}
              onChange={handleChange}
              maxLength={200}
              respclass="col-xl-3 col-md-4 col-sm-6 col-12"
            />            <Input
              type="text"
              className="form-control"
              lable={t("S/o (Father's Name)")}
              id="donorFatherName"
              name="donorFatherName"
              value={payload?.donorFatherName}
              onChange={handleChange}
              maxLength={200}
              respclass="col-xl-3 col-md-4 col-sm-6 col-12"
            />            <Input
              type="text"
              className="form-control"
              lable={t("Age")}
              id="donorAge"
              name="donorAge"
              value={payload?.donorAge}
              onChange={handleChange}
              maxLength={20}
              respclass="col-xl-3 col-md-4 col-sm-6 col-12"
            />            <Input
              type="text"
              className="form-control"
              lable={t("Aadhaar No.")}
              id="donorAadharNo"
              name="donorAadharNo"
              value={payload?.donorAadharNo}
              onChange={handleChange}
              maxLength={50}
              respclass="col-xl-3 col-md-4 col-sm-6 col-12"
            />            <Input
              type="text"
              className="form-control"
              lable={t("Address")}
              id="donorAddress"
              name="donorAddress"
              value={payload?.donorAddress}
              onChange={handleChange}
              maxLength={500}
              respclass="col-xl-3 col-md-4 col-sm-6 col-12"
            />            <Input
              type="text"
              className="form-control"
              lable={t("Occupation")}
              id="donorOccupation"
              name="donorOccupation"
              value={payload?.donorOccupation}
              onChange={handleChange}
              maxLength={100}
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
          <div className="px-2 pb-1 fw-bold">{t("Marital Status")}</div>
          <div className="d-flex flex-wrap gap-3 px-3 pb-2">
            {["Single", "Married", "Divorced", "Widowed"].map((option) => (
              <div className="form-check" key={option}>
                <input
                  className="form-check-input"
                  type="radio"
                  name="donorMaritalStatus"
                  id={`donorMaritalStatus_${option}`}
                  value={option}
                  checked={payload?.donorMaritalStatus === option}
                  onChange={handleChange}
                />
                <label className="form-check-label ms-2 ml-2 mr-4 mt-1" htmlFor={`donorMaritalStatus_${option}`}>
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
              "Consent Date": item?.ConsentDateDisplay || "",
              "Name of Donor": item?.DonorName || "",
              "S/o (Father's Name)": item?.DonorFatherName || "",
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

export default IUI_Consent_Form_Donor_Semen_for_Donor_1d;