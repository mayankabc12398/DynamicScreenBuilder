import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import moment from "moment/moment";
import {
  bindDetails_6_a_IVF_Financial_AgreementApi,
  delete_6_a_IVF_Financial_AgreementApi,
  print_6_a_IVF_Financial_AgreementApi,
  save_6_a_IVF_Financial_AgreementApi,
} from "../../networkServices/IVFApi";
import { RedirectURL } from "../../networkServices/PDFURL";
import { notify } from "../../utils/utils";
import Input from "../formComponent/Input";
import DatePicker from "../formComponent/DatePicker";
import Tables from "../UI/customTable";
import Heading from "../UI/Heading";
import Confirm from "../modalComponent/Confirm";

// IVF Form 6-a, clause 1 - Package Scope (tick applicable).
const SCOPES = [
  { key: "ownGametes", field: "OwnGametes", label: "Husband's sperm and Wife's own oocytes" },
  { key: "donorOocyte", field: "DonorOocyte", label: "Donor oocyte" },
  { key: "donorSperm", field: "DonorSperm", label: "Donor sperm" },
  { key: "donorEmbryo", field: "DonorEmbryo", label: "Donor embryo" },
];

const INITIAL = {
  id: "0",
  agreementDate: new Date(),
  ownGametes: false,
  donorOocyte: false,
  donorSperm: false,
  donorEmbryo: false,
  remarks: "",
};

// Patient demographics (names, age, mobile, address) are not entered here - the
// API reads them from patient_master / patient_medical_history when printing.
const IVF_Financial_Agreement_6a = ({ patientDetail, data }) => {
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
    { name: t("Agreement Date") },
    { name: t("Package Scope") },
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
      const response = await bindDetails_6_a_IVF_Financial_AgreementApi(transactionID);
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

  const handleCheck = (e) => {
    const { name, checked } = e.target;
    setPayload((prev) => ({ ...prev, [name]: checked }));
  };

  const resetForm = () => setPayload({ ...INITIAL, agreementDate: new Date() });

  const handleSave = async () => {
    if (!transactionID || !patientID) {
      notify("Patient details not found", "error");
      return;
    }
    if (!SCOPES.some((s) => payload[s.key])) {
      notify("Please select at least one Package Scope", "error");
      return;
    }

    const body = {
      id: payload.id || "0",
      patientID,
      transactionID,
      ivfid: ivfID,
      agreementDate: payload.agreementDate
        ? moment(payload.agreementDate).format("YYYY-MM-DD")
        : "",
      ownGametes: payload.ownGametes ? 1 : 0,
      donorOocyte: payload.donorOocyte ? 1 : 0,
      donorSperm: payload.donorSperm ? 1 : 0,
      donorEmbryo: payload.donorEmbryo ? 1 : 0,
      remarks: payload.remarks || "",
    };

    try {
      const response = await save_6_a_IVF_Financial_AgreementApi(body);
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
      agreementDate: item?.AgreementDate ? moment(item.AgreementDate).toDate() : new Date(),
      ownGametes: Number(item?.OwnGametes) === 1,
      donorOocyte: Number(item?.DonorOocyte) === 1,
      donorSperm: Number(item?.DonorSperm) === 1,
      donorEmbryo: Number(item?.DonorEmbryo) === 1,
      remarks: item?.Remarks || "",
    });
  };

  const handleDelete = async () => {
    const item = deleteConfirm.item;
    setDeleteConfirm({ show: false, item: null });
    try {
      const response = await delete_6_a_IVF_Financial_AgreementApi(item?.ID);
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
      const response = await print_6_a_IVF_Financial_AgreementApi(transactionID, item?.ID, blankPrint);
      if (response?.success) {
        RedirectURL(response?.data?.pdfUrl);
      } else {
        notify(response?.message, "error");
      }
    } catch (error) {
      notify(error?.message || "Print error", "error");
    }
  };

  const scopeText = (item) =>
    SCOPES.filter((s) => Number(item?.[s.field]) === 1)
      .map((s) => s.label)
      .join(", ");

  return (
    <>
      <div className="m-2 spatient_registration_card">
        <div className="patient_registration card">
          <Heading title={t("6-a_IVF_Financial_Agreement")} />
          <div className="row p-2">
            <DatePicker
              placeholder={VITE_DATE_FORMAT}
              className="custom-calendar"
              lable={t("Agreement Date")}
              name="agreementDate"
              id="agreementDate"
              value={payload?.agreementDate}
              handleChange={handleChange}
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
            {t("Package Scope (tick applicable, as recorded in the accompanying consent form)")}
          </div>
          <div className="row px-3 pb-2">
            {SCOPES.map((s) => (
              <div className="form-check col-xl-3 col-md-6 col-12" key={s.key}>
                <input
                  className="form-check-input"
                  type="checkbox"
                  id={`ivfFA_${s.key}`}
                  name={s.key}
                  checked={!!payload[s.key]}
                  onChange={handleCheck}
                />
                <label className="form-check-label ms-2 ml-2 mt-1" htmlFor={`ivfFA_${s.key}`}>
                  {t(s.label)}
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
              "Agreement Date": item?.AgreementDateDisplay || "",
              "Package Scope": scopeText(item),
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

export default IVF_Financial_Agreement_6a;
