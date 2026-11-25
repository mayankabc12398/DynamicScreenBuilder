import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Input from "../formComponent/Input";
import EcmoTables from "../UI/customTable/AnastheticOperativeTable/EcmoTable";
import DatePicker from "../formComponent/DatePicker";
import {
  getInvasiveDeviceDataApi,
  getSavedInvasiveDeviceDataApi,
  saveInvasiveDeviceDataApi,
  UpdateInvasiveDeviceFormApi,
} from "../../networkServices/nursingWardAPI";
import Tables from "../UI/customTable";
import Heading from "../UI/Heading";
import { notify } from "../../utils/ustil2";
import moment from "moment";

const InvasiveDevice = ({ data }) => {
  const { t } = useTranslation();
  const { patientID, transactionID } = data;
  const { VITE_DATE_FORMAT } = import.meta.env;

  const [savedTable, setSavedTable] = useState([]);
  const [editId, setEditId] = useState(null);

  const initialRow = {
    InvasiveDevice: "",
    DateInserted: new Date(),
    DateRemoved: new Date(),
    DateTime: new Date(),
    Specimen: "",
    CultureReport: "",
    Sensitivity: "",
  };

  const [payload, setPayload] = useState({ eCMODetails: [initialRow] });

  const tableHeadersForm = [
    { name: t("Invasive Device") },
    { name: t("Date Inserted") },
    { name: t("Date Removed") },
    { name: t("Date / Time") },
    { name: t("Specimen") },
    { name: t("Culture Report") },
    { name: t("Sensitivity") },
    { name: t("Action"), width: "5%" },
  ];

  const tableHeadersSaved = [
    { name: t("S.No."), width: "4%" },
    { name: t("UHID") },
    { name: t("Entered By") },
    { name: t("Edit"), width: "5%" },
  ];

  const loadSavedTable = async () => {
    try {
      const res = await getInvasiveDeviceDataApi(patientID);
      const apiData = res?.data;
      setSavedTable(
        Array.isArray(apiData) ? apiData : apiData ? [apiData] : [],
      );
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  };
  const parseApiDate = (value) => {
    if (!value) return null;

    const cleaned = value.endsWith(".") ? value.slice(0, -1) : value;

    if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
      const [y, m, d] = cleaned.split("-");
      return new Date(Number(y), Number(m) - 1, Number(d));
    }

    const date = new Date(cleaned.replace("T", " "));
    return isNaN(date.getTime()) ? null : date;
  };

  useEffect(() => {
    if (patientID) loadSavedTable();
  }, [patientID]);

  const addNewRow = () => {
    setPayload((prev) => ({
      ...prev,
      eCMODetails: [...prev.eCMODetails, { ...initialRow }],
    }));
  };

  const removeRow = (index) => {
    setPayload((prev) => ({
      ...prev,
      eCMODetails: prev.eCMODetails.filter((_, i) => i !== index),
    }));
  };

  const handleInputChange = (rowIndex, fieldName, value) => {
    setPayload((prev) => {
      const updated = [...prev.eCMODetails];
      updated[rowIndex][fieldName] = value;
      return { ...prev, eCMODetails: updated };
    });
  };

  const formatTableData = (data) =>
    data?.map((row, index) => ({
      [t("Invasive Device")]: (
        <Input
          type="text"
          name="InvasiveDevice"
          id="InvasiveDevice"
          className="form-control form-control-sm"
          value={row.InvasiveDevice}
          onChange={(e) =>
            handleInputChange(index, "InvasiveDevice", e.target.value)
          }
        />
      ),
      [t("Date Inserted")]: (
        <DatePicker
          className="form-control-sm"
          name="DateInserted"
          id="DateInserted"
          placeholder={VITE_DATE_FORMAT}
          value={row.DateInserted}
          handleChange={(e) =>
            handleInputChange(index, "DateInserted", e.value)
          }
          hideLabel
        />
      ),
      [t("Date Removed")]: (
        <DatePicker
          className="form-control-sm"
          name="DateRemoved"
          id="DateRemoved"
          placeholder={VITE_DATE_FORMAT}
          value={row.DateRemoved}
          handleChange={(e) => handleInputChange(index, "DateRemoved", e.value)}
          hideLabel
        />
      ),
      [t("Date / Time")]: (
        <DatePicker
          className="form-control-sm"
          name="DateTime"
          id="DateTime"
          placeholder={VITE_DATE_FORMAT}
          value={row.DateTime}
          handleChange={(e) => handleInputChange(index, "DateTime", e.value)}
          hideLabel
        />
      ),
      [t("Specimen")]: (
        <Input
          type="text"
          name="Specimen"
          id="Specimen"
          className="form-control form-control-sm"
          value={row.Specimen}
          onChange={(e) => handleInputChange(index, "Specimen", e.target.value)}
        />
      ),
      [t("Culture Report")]: (
        <Input
          type="text"
          id="CultureReport"
          name="CultureReport"
          className="form-control form-control-sm"
          value={row.CultureReport}
          onChange={(e) =>
            handleInputChange(index, "CultureReport", e.target.value)
          }
        />
      ),
      ["Sensitivity"]: (
        <Input
          type="text"
          name="Sensitivity"
          id="Sensitivity"
          className="form-control form-control-sm"
          value={row.Sensitivity}
          onChange={(e) =>
            handleInputChange(index, "Sensitivity", e.target.value)
          }
        />
      ),
      [t("Action")]: (
        <div className="d-flex gap-2">
          <button className="btn btn-sm btn-success" onClick={addNewRow}>
            +
          </button>
          {payload.eCMODetails.length > 1 && (
            <button
              className="btn btn-sm btn-danger"
              onClick={() => removeRow(index)}
            >
              -
            </button>
          )}
        </div>
      ),
    }));

  const convertToSavePayload = () =>
    payload.eCMODetails?.map((item) => ({
      patientID: String(patientID),
      transactionID: Number(transactionID),
      invasiveDevice: item.InvasiveDevice,
      dateInserted: item.DateInserted,
      dateRemoved: item.DateRemoved,
      date_Time: item.DateTime,
      specimen: item.Specimen,
      cultureReport: item.CultureReport,
      sensitivity: item.Sensitivity,
    }));

  const convertToUpdatePayload = () =>
    payload.eCMODetails?.map((item) => ({
      patientID: String(patientID),
      id: editId,
      transactionID: Number(transactionID),
      invasiveDevice: item?.InvasiveDevice,
      dateInserted: moment(item.DateInserted).format("yyyy-MM-DD"),
      dateRemoved: item?.DateRemoved,
      date_Time: item?.DateTime,
      specimen: item?.Specimen,
      cultureReport: item?.CultureReport,
      sensitivity: item?.Sensitivity,
    }));

  const handleSave = async () => {
    try {
      const res = await saveInvasiveDeviceDataApi(convertToSavePayload());
      if (res?.success) {
        notify(res?.message, "success");
        setPayload({ eCMODetails: [initialRow] });
        loadSavedTable();
      }
    } catch (err) {
      console.error("Save Error:", err);
    }
  };

  const handleUpdate = async () => {
    try {
      const res = await UpdateInvasiveDeviceFormApi(convertToUpdatePayload());
      if (res?.success) {
        notify(t("Updated Successfully"));
        setEditId(null);
        setPayload({ eCMODetails: [initialRow] });
        loadSavedTable();
      }
    } catch (err) {
      console.error("Update Error:", err);
    }
  };

  const handleCancel = () => {
    setEditId(null);
    setPayload({ eCMODetails: [initialRow] });
  };

  const handleEdit = async (data) => {
    try {
      const patientID = data.patientID || data.PatientID;
      setEditId(data.id);

      const res = await getSavedInvasiveDeviceDataApi(patientID);

      if (Array.isArray(res?.data) && res.data.length > 0) {
        const latest = res.data[res.data.length - 1];

        const row = {
          InvasiveDevice: latest?.InvasiveDevice ?? "",
          DateInserted: parseApiDate(latest?.DateInserted),
          DateRemoved: parseApiDate(latest?.DateRemoved),
          DateTime: parseApiDate(latest?.Date_Time),
          Specimen: latest?.Specimen ?? "",
          CultureReport: latest?.CultureReport ?? "",
          Sensitivity: latest?.Sensitivity ?? "",
        };

        setPayload({ eCMODetails: [row] });
      } else {
        setPayload({ eCMODetails: [initialRow] });
      }
    } catch (err) {
      console.error("Edit Load Error:", err);
      setPayload({ eCMODetails: [initialRow] });
    }
  };

  return (
    <div className="card patient_registration border mt-2">
      <div className="card card_background">
        <Heading isBreadcrumb={false} title={t("Invasive Device Form")} />

        <div className="p-3">
          <EcmoTables
            thead={tableHeadersForm}
            tbody={formatTableData(payload.eCMODetails)}
          />
        </div>

        <div className="row mb-3 mt-3">
          <div className="col d-flex justify-content-end gap-2">
            {!editId ? (
              <button
                className="btn btn-sm mr-2"
                style={{
                  backgroundColor: "#008CBA",
                  border: "none",
                  color: "#fff",
                }}
                onClick={handleSave}
              >
                {t("Save")}
              </button>
            ) : (
              <>
                <button
                  className="btn btn-sm mr-2"
                  style={{
                    backgroundColor: "#28a745",
                    border: "none",
                    color: "#fff",
                  }}
                  onClick={handleUpdate}
                >
                  {t("Update")}
                </button>

                <button
                  className="btn btn-sm mr-2"
                  style={{
                    backgroundColor: "#dc3545",
                    border: "none",
                    color: "#fff",
                  }}
                  onClick={handleCancel}
                >
                  {t("Cancel")}
                </button>
              </>
            )}
          </div>
        </div>
        {savedTable && savedTable.length > 0 && (
          <>
            <Heading title={t("Invasive List")} isBreadcrumb={false} />
            <Tables
              thead={tableHeadersSaved}
              tbody={savedTable?.map((item, index) => ({
                "S.no.": index + 1,
                UHID: item?.PatientID || item?.patientID || "-",
                ENTEREDBY: item?.EmployeeName || item?.createdBy || "-",
                Edit: (
                  <i
                    className="fa fa-edit p-1"
                    onClick={() => handleEdit(item)}
                    style={{ cursor: "pointer", color: "blue" }}
                  />
                ),
              }))}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default InvasiveDevice;
