import React, { useState, useEffect, useCallback } from "react";
import Heading from "../UI/Heading";
import DatePicker from "../formComponent/DatePicker";
import Input from "../formComponent/Input";
import { useTranslation } from "react-i18next";
import {
  NursingWardSaveLivkanNeclampsiaForm,
  NursingWardGetLivkanNeclampsiaForm,
  NursingWardUpdateLivkanNeclampsiaForm,
} from "../../networkServices/nursingWardAPI";
import Tables from "../UI/customTable";
import { notify } from "../../utils/utils";

const LivkanNeclampsiaForm = ({ data, onClose }) => {
  const { VITE_DATE_FORMAT } = import.meta.env;
  const patientId = data?.patientID;
  const transactionId = data?.transactionID;
  const [t] = useTranslation();
  const [values, setValues] = useState({
    gravida: "",
    para: "",
    date: new Date(),
    rows: [createEmptyRow()],
  });
  const [savedRecords, setSavedRecords] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentRecordId, setCurrentRecordId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const timeOptions = [
    "12:00 AM",
    "12:30 AM",
    "1:00 AM",
    "1:30 AM",
    "2:00 AM",
    "2:30 AM",
    "3:00 AM",
    "3:30 AM",
    "4:00 AM",
    "4:30 AM",
    "5:00 AM",
    "5:30 AM",
    "6:00 AM",
    "6:30 AM",
    "7:00 AM",
    "7:30 AM",
    "8:00 AM",
    "8:30 AM",
    "9:00 AM",
    "9:30 AM",
    "10:00 AM",
    "10:30 AM",
    "11:00 AM",
    "11:30 AM",
    "12:00 PM",
    "12:30 PM",
    "1:00 PM",
    "1:30 PM",
    "2:00 PM",
    "2:30 PM",
    "3:00 PM",
    "3:30 PM",
    "4:00 PM",
    "4:30 PM",
    "5:00 PM",
    "5:30 PM",
    "6:00 PM",
    "6:30 PM",
    "7:00 PM",
    "7:30 PM",
    "8:00 PM",
    "8:30 PM",
    "9:00 PM",
    "9:30 PM",
    "10:00 PM",
    "10:30 PM",
    "11:00 PM",
    "11:30 PM",
  ];

  const hoursOptions = Array.from({ length: 25 }, (_, i) => i.toString());

  const fitsOptions = Array.from({ length: 11 }, (_, i) => i.toString());

  const consciousnessOptions = [
    { value: "A", label: t("A (Alert)") },
    { value: "V", label: t("V (Verbal)") },
    { value: "P", label: t("P (Pain)") },
    { value: "U", label: t("U (Unresponsive)") },
  ];

  const urineOptions = ["4+", "3+", "2+", "1+", "Trace", "Negative"];

  const INPUT_TABLE_COLUMNS = [
    { width: "5%", name: t("Hours") },
    { width: "5%", name: t("Time") },
    { width: "5%", name: t("FHR") },
    { width: "5%", name: t("Hydralazine") },
    { width: "5%", name: t("Nifedipine") },
    { width: "5%", name: t("Labetolol") },
    { width: "5%", name: t("Fits") },
    { width: "5%", name: t("Consciousness") },
    { width: "5%", name: t("Urine") },
    { width: "5%", name: t("Input (ml)") },
    { width: "5%", name: t("Output (ml)") },
    { width: "5%", name: t("Respiratory Rate") },
    { width: "5%", name: t("Deep Tendon Reflex") },
    { width: "5%", name: t("MgSO4 Dose") },
    { width: "5%", name: t("MgSO4 Route") },
    { width: "5%", name: t("Antidose Gluconate") },
    { width: "5%", name: t("Action") },
  ];

  const SAVED_RECORDS_COLUMNS = [
    { width: "3%", name: t("Sr.No") },
    { width: "5%", name: t("Hours") },
    { width: "5%", name: t("Time") },
    { width: "5%", name: t("FHR") },
    { width: "5%", name: t("Hydralazine") },
    { width: "5%", name: t("Nifedipine") },
    { width: "5%", name: t("Labetolol") },
    { width: "5%", name: t("Fits") },
    { width: "5%", name: t("Consciousness") },
    { width: "5%", name: t("Urine") },
    { width: "5%", name: t("Input (ml)") },
    { width: "5%", name: t("Output (ml)") },
    { width: "5%", name: t("Respiratory Rate") },
    { width: "5%", name: t("Deep Tendon Reflex") },
    { width: "5%", name: t("MgSO4 Dose") },
    { width: "5%", name: t("MgSO4 Route") },
    { width: "5%", name: t("Antidose Gluconate") },
    { width: "5%", name: t("Created By") },
    { width: "5%", name: t("Created Date") },
    { width: "3%", name: t("Edit") },
  ];

  function createEmptyRow() {
    return {
      hours: "",
      time: "",
      fhr: "",
      hydralazine: "",
      nifedipine: "",
      labetolol: "",
      fits: "",
      consciousness: "",
      urine: "",
      input: "",
      output: "",
      respiratoryRate: "",
      deepTendonReflex: "",
      mgso4Dose: "",
      mgso4Route: "",
      antidoseGluconate: "",
    };
  }

  useEffect(() => {
    if (patientId && transactionId) {
      fetchSavedRecords();
    }
  }, [patientId, transactionId]);

  const fetchSavedRecords = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await NursingWardGetLivkanNeclampsiaForm(transactionId);

      if (response?.success) {
        if (response.data && Array.isArray(response.data)) {
          setSavedRecords(response.data);
        } else if (response.data?.rows) {
          setSavedRecords(response.data.rows);
        } else {
          setSavedRecords([]);
        }
      } else {
        notify(response?.message || "Failed to fetch records", "error");
      }
    } catch (error) {
      console.error("Error fetching records:", error);
      notify(error?.message || "Network error", "error");
    } finally {
      setIsLoading(false);
    }
  }, [patientId, transactionId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRowChange = (index, field, value) => {
    const updatedRows = [...values.rows];
    updatedRows[index][field] = value;
    setValues({
      ...values,
      rows: updatedRows,
    });
  };

  const addRow = () => {
    setValues((prev) => ({
      ...prev,
      rows: [...prev.rows, createEmptyRow()],
    }));
  };

  const removeRow = (index) => {
    if (values.rows.length > 1) {
      const updatedRows = values.rows.filter((_, i) => i !== index);
      setValues({
        ...values,
        rows: updatedRows,
      });
    }
  };
  const buildPayload = () => ({
    patientId,
    transactionId,
    gravida: values.gravida || "",
    para: values.para || "",
    date: values.date || "",
    rows: values.rows.map((row) => ({
      id: 0,
      patientId,
      transactionId,
      gravida: values.gravida || "",
      para: values.para || "",
      date: values.date || "",
      hospitalNo: null,
      time: row.time || "",
      hours: row.hours || "",
      fhr: row.fhr || "",
      hydralazine: row.hydralazine || "",
      nifedipine: row.nifedipine || "",
      labetolol: row.labetolol || "",
      fits: row.fits || "",
      levelOfConsciousness: row.consciousness || "",
      urineProteinuria: row.urine || "",
      inputMis: row.input || "",
      outputMis: row.output || "",
      respiratoryRate: row.respiratoryRate || "",
      deepTendonReflex: row.deepTendonReflex || "",
      mgSO4Dose: row.mgso4Dose || "",
      mgSO4Route: row.mgso4Route || "",
      antidoseCaGluconate: row.antidoseGluconate || "",
      createdDate: new Date().toISOString(),
      createdBy: "Mr.Administrator",
    })),
  });

  const handleSave = async () => {
    try {
      if (!values.gravida || !values.para || !values.date) {
        notify(t("Please fill Gravida, Para and Date"), "warning");
        return;
      }

      setIsLoading(true);

      const payload = {
        id: 0,
        ...buildPayload(),
      };

      console.log("SAVE Payload:", payload);

      const response = await NursingWardSaveLivkanNeclampsiaForm(payload);

      if (response?.success) {
        notify(t("Record saved successfully"), "success");
        resetForm();
        await fetchSavedRecords();
      } else {
        notify(response?.message || "Save failed", "error");
      }
    } catch (error) {
      console.error("Save Error:", error);
      notify(t("Error saving data"), "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      console.log("CurrentRecordId:", currentRecordId);

      if (!currentRecordId) {
        notify(t("No record selected for update"), "warning");
        return;
      }

      setIsLoading(true);

      const payload = {
        id: currentRecordId,
        ...buildPayload(),
      };

      console.log("UPDATE Payload:", payload);

      const response = await NursingWardUpdateLivkanNeclampsiaForm(payload);

      console.log("UPDATE RESPONSE:", response);

      if (response?.success) {
        notify(t("Record updated successfully"), "success");
        resetForm();
        await fetchSavedRecords();
      } else {
        notify(response?.message || "Update failed", "error");
      }
    } catch (error) {
      console.error("Update Error:", error);
      notify(t("Error updating data"), "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (row) => {
    console.log("Editing row:", row);

    setValues({
      gravida: row.Gravida,
      para: row.Para,
      date: row.Date || row.date || new Date(),
      rows: [
        {
          hours: row.Hours || "",
          time: row.TIME || "",
          fhr: row.FHR || "",
          hydralazine: row.Hydralazine || "",
          nifedipine: row.Nifedipine || "",
          labetolol: row.Labetolol || "",
          fits: row.Fits || "",
          consciousness: row.LevelOfConsciousness || "",
          urine: row.UrineProteinuria || "",
          input: row.InputMis || "",
          output: row.OutputMis || "",
          respiratoryRate: row.RespiratoryRate || "",
          deepTendonReflex: row.DeepTendonReflex || "",
          mgso4Dose: row.MgSO4Dose || "",
          mgso4Route: row.MgSO4Route || "",
          antidoseGluconate: row.AntidoseCaGluconate || "",
        },
      ],
    });

    setCurrentRecordId(row.Id);

    setIsEditMode(true);

    notify(t("Record loaded for editing"), "success");
  };

  const resetForm = () => {
    setValues({
      gravida: "",
      para: "",
      date: new Date(),
      rows: [createEmptyRow()],
    });
    setIsEditMode(false);
    setCurrentRecordId(null);
  };

  return (
    <div className="card">
      {/* Header with close button like InternalNewbornUnit */}
      <Heading
        title={<span className="text-dark">{t("ECLAMPSIA RECORDS")}</span>}
        secondTitle={
          onClose && (
            <button
              className="py-2"
              onClick={onClose}
              style={{ background: "none", border: "none" }}
            >
              ✕
            </button>
          )
        }
      />

      <div className="row p-2 mb-3">
        <Input
          type="text"
          className="form-control"
          id="gravida"
          lable={t("Gravida")}
          placeholder={t("Enter Gravida")}
          required={true}
          value={values?.gravida}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="gravida"
          onChange={handleChange}
          disabled={isLoading}
        />
        <Input
          type="text"
          className="form-control"
          id="para"
          lable={t("Para")}
          placeholder={t("Enter Para")}
          required={true}
          value={values?.para}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="para"
          onChange={handleChange}
          disabled={isLoading}
        />

        <DatePicker
          className="custom-calendar"
          placeholder={VITE_DATE_FORMAT}
          lable={t("Date")}
          respclass={"col-xl-2 col-md-3 col-sm-4 col-12"}
          name="date"
          id="date"
          value={values?.date}
          showTime
          hourFormat="12"
          handleChange={handleChange}
        />
      </div>

      <div className="card mb-4">
        <div className="card-header bg-primary text-white">
          <Heading
            title={
              <span className="text-white">
                {isEditMode ? t("Edit Observation") : t("Enter Observation Data")}
              </span>
            }
          />
        </div>
        <div className="card-body p-0">
          <Tables
            scrollView={"scrollView"}
            thead={INPUT_TABLE_COLUMNS}
            tbody={values.rows.map((row, ind) => ({
              Hours: (
                <select
                  className="form-control form-control-sm"
                  value={row?.hours || ""}
                  onChange={(e) =>
                    handleRowChange(ind, "hours", e.target.value)
                  }
                  disabled={isLoading}
                >
                  <option value="">{t("Select Hours")}</option>
                  {hoursOptions.map((hour) => (
                    <option key={hour} value={hour}>
                      {hour}
                    </option>
                  ))}
                </select>
              ),
              Time: (
                <select
                  className="form-control form-control-sm"
                  value={row?.time || ""}
                  onChange={(e) => handleRowChange(ind, "time", e.target.value)}
                  disabled={isLoading}
                >
                  <option value="">{t("Select Time")}</option>
                  {timeOptions.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              ),
              FHR: (
                <Input
                  type="text"
                  className="table-input"
                  removeFormGroupClass={true}
                  name="fhr"
                  placeholder={t("FHR")}
                  value={row.fhr}
                  onChange={(e) => handleRowChange(ind, "fhr", e.target.value)}
                  disabled={isLoading}
                />
              ),
              Hydralazine: (
                <Input
                  type="text"
                  className="table-input"
                  removeFormGroupClass={true}
                  name="hydralazine"
                  placeholder={t("Hydralazine")}
                  value={row.hydralazine}
                  onChange={(e) =>
                    handleRowChange(ind, "hydralazine", e.target.value)
                  }
                  disabled={isLoading}
                />
              ),
              Nifedipine: (
                <Input
                  type="text"
                  className="table-input"
                  removeFormGroupClass={true}
                  name="nifedipine"
                  placeholder={t("Nifedipine")}
                  value={row.nifedipine}
                  onChange={(e) =>
                    handleRowChange(ind, "nifedipine", e.target.value)
                  }
                  disabled={isLoading}
                />
              ),
              Labetolol: (
                <Input
                  type="text"
                  className="table-input"
                  removeFormGroupClass={true}
                  name="labetolol"
                  placeholder={t("Labetolol")}
                  value={row.labetolol}
                  onChange={(e) =>
                    handleRowChange(ind, "labetolol", e.target.value)
                  }
                  disabled={isLoading}
                />
              ),
              Fits: (
                <select
                  className="form-control form-control-sm"
                  value={row?.fits || ""}
                  onChange={(e) => handleRowChange(ind, "fits", e.target.value)}
                  disabled={isLoading}
                >
                  <option value="">{t("Select Fits")}</option>
                  {fitsOptions.map((fit) => (
                    <option key={fit} value={fit}>
                      {fit}
                    </option>
                  ))}
                </select>
              ),
              Consciousness: (
                <select
                  className="form-control form-control-sm"
                  value={row?.consciousness || ""}
                  onChange={(e) =>
                    handleRowChange(ind, "consciousness", e.target.value)
                  }
                  disabled={isLoading}
                >
                  <option value="">{t("Select")}</option>
                  {consciousnessOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ),
              Urine: (
                <select
                  className="form-control form-control-sm"
                  value={row?.urine || ""}
                  onChange={(e) =>
                    handleRowChange(ind, "urine", e.target.value)
                  }
                  disabled={isLoading}
                >
                  <option value="">{t("Select")}</option>
                  {urineOptions.map((urine) => (
                    <option key={urine} value={urine}>
                      {urine}
                    </option>
                  ))}
                </select>
              ),
              "Input (ml)": (
                <Input
                  type="text"
                  className="table-input"
                  removeFormGroupClass={true}
                  name="input"
                  placeholder={t("Input ml")}
                  value={row.input}
                  onChange={(e) =>
                    handleRowChange(ind, "input", e.target.value)
                  }
                  disabled={isLoading}
                />
              ),
              "Output (ml)": (
                <Input
                  type="text"
                  className="table-input"
                  removeFormGroupClass={true}
                  name="output"
                  placeholder={t("Output ml")}
                  value={row.output}
                  onChange={(e) =>
                    handleRowChange(ind, "output", e.target.value)
                  }
                  disabled={isLoading}
                />
              ),
              "Respiratory Rate": (
                <Input
                  type="text"
                  className="table-input"
                  removeFormGroupClass={true}
                  name="respiratoryRate"
                  placeholder={t("Rate")}
                  value={row.respiratoryRate}
                  onChange={(e) =>
                    handleRowChange(ind, "respiratoryRate", e.target.value)
                  }
                  disabled={isLoading}
                />
              ),
              "Deep Tendon Reflex": (
                <Input
                  type="text"
                  className="table-input"
                  removeFormGroupClass={true}
                  name="deepTendonReflex"
                  placeholder={t("Reflex")}
                  value={row.deepTendonReflex}
                  onChange={(e) =>
                    handleRowChange(ind, "deepTendonReflex", e.target.value)
                  }
                  disabled={isLoading}
                />
              ),
              "MgSO4 Dose": (
                <Input
                  type="text"
                  className="table-input"
                  removeFormGroupClass={true}
                  name="mgso4Dose"
                  placeholder={t("Dose")}
                  value={row.mgso4Dose}
                  onChange={(e) =>
                    handleRowChange(ind, "mgso4Dose", e.target.value)
                  }
                  disabled={isLoading}
                />
              ),
              "MgSO4 Route": (
                <Input
                  type="text"
                  className="table-input"
                  removeFormGroupClass={true}
                  name="mgso4Route"
                  placeholder={t("Route")}
                  value={row.mgso4Route}
                  onChange={(e) =>
                    handleRowChange(ind, "mgso4Route", e.target.value)
                  }
                  disabled={isLoading}
                />
              ),
              "Antidose Gluconate": (
                <Input
                  type="text"
                  className="table-input"
                  removeFormGroupClass={true}
                  name="antidoseGluconate"
                  placeholder={t("Antidose")}
                  value={row.antidoseGluconate}
                  onChange={(e) =>
                    handleRowChange(ind, "antidoseGluconate", e.target.value)
                  }
                  disabled={isLoading}
                />
              ),
              Action: (
                <div className="d-flex gap-1">
                  {!isEditMode && (
                    <>
                      <button
                        type="button"
                        className="btn btn-sm btn-success mr-2"
                        onClick={addRow}
                        title={t("Add Row")}
                      >
                        <i className="bi bi-plus-lg mt-3"></i>
                      </button>
                      {values.rows.length > 1 && (
                        <button
                          type="button"
                          className="btn btn-sm btn-danger"
                          onClick={() => removeRow(ind)}
                          title={t("Remove Row")}
                        >
                          <i className="bi bi-dash-lg mt-3"></i>
                        </button>
                      )}
                    </>
                  )}
                </div>
              ),
            }))}
          />
        </div>
        <div className="card-footer">
          <div className="d-flex justify-content-end gap-2">
            {!isEditMode ? (
              <button className="btn btn-sm btn-primary" onClick={handleSave}>
                {t("Save")}
              </button>
            ) : (
              <>
                <button
                  className="btn btn-sm btn-primary mr-2"
                  onClick={handleUpdate}
                >
                  {t("Update")}
                </button>
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={resetForm}
                >
                  {t("Cancel")}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {savedRecords.length > 0 && (
        <Tables
          scrollView={"scrollView"}
          thead={SAVED_RECORDS_COLUMNS}
          tbody={savedRecords.map((row, index) => ({
            "Sr.No": index + 1,
            Hours: row.Hours || "-",
            Time: row.TIME || "-",
            FHR: row.FHR || "-",
            Hydralazine: row.Hydralazine || "-",
            Nifedipine: row.Nifedipine || "-",
            Labetolol: row.Labetolol || "-",
            Fits: row.Fits || "-",
            Consciousness: row.LevelOfConsciousness || "-",
            Urine: row.UrineProteinuria || "-",
            "Input (ml)": row.InputMis || "-",
            "Output (ml)": row.OutputMis || "-",
            "Respiratory Rate": row.RespiratoryRate || "-",
            "Deep Tendon Reflex": row.DeepTendonReflex || "-",
            "MgSO4 Dose": row.MgSO4Dose || "-",
            "MgSO4 Route": row.MgSO4Route || "-",
            "Antidose Gluconate": row.AntidoseCaGluconate || "-",
            "Created By": row.CreatedBy || "-",
            "Created Date": row.CreatedDate
              ? new Date(row.CreatedDate).toLocaleDateString()
              : "-",
            Edit: (
              <i
                className="bi bi-pencil-square"
                style={{
                  cursor: "pointer",
                  color: "#007bff",
                  fontSize: "1.2rem",
                }}
                onClick={() => handleEdit(row)}
                title={t("Edit")}
              />
            ),
          }))}
        />
      )}
    </div>
  );
};

export default LivkanNeclampsiaForm;
