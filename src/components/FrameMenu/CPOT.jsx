import React, { useState, useEffect, useCallback } from "react";
import Heading from "../UI/Heading";
import Input from "../formComponent/Input";
import { useTranslation } from "react-i18next";
import Tables from "../UI/customTable";
import {
  NursingWardSaveCPOTForm,
  NursingWardUpdateCPOTForm,
  NursingWardBindCPOTForm,
  NursingWardEditCPOTForm,
} from "../../networkServices/nursingWardAPI";
import { notify } from "../../utils/utils";

const CPOT = ({ data }) => {
  const [t] = useTranslation();
  const patientID = data?.patientID;
  const transactionID = data?.transactionID;

  const [values, setValues] = useState({
    facialExpression: "",
    bodyMovements: "",
    ventilator: "",
    vocalization: "",
    muscleTension: "",
    total: "0",
    extubatedpatients: "0",
  });

  const [tableData, setTableData] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentRecordId, setCurrentRecordId] = useState(null);

  const CPOTRECORDS = [
    { width: "1%", name: t("Sr.No") },
    { width: "5%", name: t("Facial") },
    { width: "3%", name: t("Body") },
    { width: "3%", name: t("Ventilator") },
    { width: "3%", name: t("Muscle") },
    { width: "5%", name: t("Total") },
    { width: "5%", name: t("Created By") },
    { width: "5%", name: t("Created Date") },
    { width: "3%", name: t("Edit") },
  ];

  useEffect(() => {
    const facial = parseInt(values.facialExpression) || 0;
    const body = parseInt(values.bodyMovements) || 0;
    const ventilator = parseInt(values.ventilator) || 0;
    const muscle = parseInt(values.muscleTension) || 0;

    const total = facial + body + ventilator + muscle;
    setValues((prev) => ({ ...prev, total: total.toString() }));
  }, [
    values.facialExpression,
    values.bodyMovements,
    values.ventilator,
    values.muscleTension,
  ]);

  useEffect(() => {
    if (transactionID) {
      fetchCPOTRecords();
    }
  }, [transactionID]);

  const fetchCPOTRecords = useCallback(async () => {
    if (!transactionID) return;

    try {
      const response = await NursingWardBindCPOTForm(transactionID);

      if (response?.data) {
        setTableData(response.data);
      }
    } catch (error) {
      notify(t("Error fetching CPOT records"), "error");
      console.error(error);
    }
  }, [transactionID]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (
      [
        "facialExpression",
        "bodyMovements",
        "ventilator",
        "muscleTension",
      ].includes(name)
    ) {
      const num = parseInt(value);
      if (value && (num < 0 || num > 2)) {
        notify(t("Score must be between 0 and 2"), "warning");
        return;
      }
    }

    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (
      !values.facialExpression ||
      !values.bodyMovements ||
      !values.ventilator ||
      !values.muscleTension
    ) {
      notify(t("Please fill all score fields"), "warning");
      return;
    }

    const payload = {
      id: currentRecordId || 0,
      patientID,
      transactionID,
      facialExpression: values.facialExpression,
      bodyMovements: values.bodyMovements,
      vocalization: values.ventilator,
      muscleTension: values.muscleTension,
      total: values.total,
      createdDate: new Date().toISOString(),
      createdBy: "current_user",
      updateDate: new Date().toISOString(),
      updatedBy: "current_user",
      extubatedpatients: values.extubatedpatients,
    };

    try {
      if (isEditMode) {
        await NursingWardUpdateCPOTForm(payload);
        notify(t("CPOT record updated successfully"), "success");
      } else {
        await NursingWardSaveCPOTForm(payload);
        notify(t("CPOT record saved successfully"), "success");
      }

      setValues({
        facialExpression: "",
        bodyMovements: "",
        ventilator: "",
        vocalization: "",
        muscleTension: "",
        total: "0",
        extubatedpatients: "0",
      });

      setIsEditMode(false);
      setCurrentRecordId(null);
      fetchCPOTRecords();
    } catch (error) {
      notify(t("Error saving CPOT record"), "error");
      console.error(error);
    }
  };

  const handleEdit = async (row) => {
    try {
      const response = await NursingWardEditCPOTForm(row.Id);

      if (response?.data) {
        const record = response.data;
        setValues({
          facialExpression: record.facialExpression || "",
          bodyMovements: record.bodyMovements || "",
          ventilator: record.vocalization || "",
          vocalization: record.vocalization || "",
          muscleTension: record.muscleTension || "",
          total: record.total || "0",
          extubatedpatients: record.extubatedpatients || "0",
        });
        setIsEditMode(true);
        setCurrentRecordId(record.id);
      }
    } catch (error) {
      notify(t("Error loading record"), "error");
      console.error(error);
    }
  };

  const handleCancel = () => {
    setValues({
      facialExpression: "",
      bodyMovements: "",
      ventilator: "",
      vocalization: "",
      muscleTension: "",
      total: "0",
      extubatedpatients: "0",
    });
    setIsEditMode(false);
    setCurrentRecordId(null);
  };
  return (
    <>
      <div className="row mb-3">
        <div className="col-12">
          <Heading title={<span>{t("CPOT Assessment")}</span>} />
        </div>
      </div>

      {/* Facial Expression Section */}
      <Heading title={<span>{t("Facial Expression")}</span>} />
      <div className="row p-2 border rounded mb-3">
        <div className="col-xl-2 col-md-3 col-sm-6 col-12">
          <div className="col p-2">
            <Heading title={<span>{t("Indicator")}</span>} />
          </div>
          <p>{t("Relaxed, Neutral")}</p>
          <p>{t("Tense")}</p>
          <p>{t("Grimacing")}</p>
        </div>
        <div className="col-xl-2 col-md-3 col-sm-6 col-12">
          <div className="col p-2">
            <Heading title={<span>{t("Score")}</span>} />
          </div>
          <p>0</p>
          <p>1</p>
          <p>2</p>
        </div>
        <div className="col-xl-2 col-md-3 col-sm-6 col-12">
          <div className="col p-2">
            <Heading title={<span>{t("Description")}</span>} />
          </div>
          <p>{t("No muscle tension observed")}</p>
          <p>{t("Frowning, brow lowering, orbit tightening, or tearing")}</p>
          <p>{t("Eyelids tightly closed, biting endotracheal tube")}</p>
        </div>
        <div className="col-xl-2 col-md-3 col-sm-6 col-12">
          <div className="col p-2">
            <Heading title={<span>{t("Your Score")}</span>} />
          </div>
          <Input
            type="number"
            min="0"
            max="2"
            className="form-control"
            id="facialExpression"
            lable={t("Your Score")}
            placeholder=" "
            required={true}
            value={values?.facialExpression}
            respclass="col-xl-4 col-md-4 col-sm-6 col-12"
            name="facialExpression"
            onChange={handleChange}
          />
        </div>
      </div>

      {/* Body Movements Section */}
      <Heading title={<span>{t("Body Movements")}</span>} />
      <div className="row p-2 border rounded mb-3">
        <div className="col-xl-2 col-md-3 col-sm-6 col-12">
          <div className="col p-2">
            <Heading title={<span>{t("Indicator")}</span>} />
          </div>
          <p>{t("Absence of movements / Normal")}</p>
          <p>{t("Protection")}</p>
          <p>{t("Restlessness / Agitation")}</p>
        </div>
        <div className="col-xl-2 col-md-3 col-sm-6 col-12">
          <div className="col p-2">
            <Heading title={<span>{t("Score")}</span>} />
          </div>
          <p>0</p>
          <p>1</p>
          <p>2</p>
        </div>
        <div className="col-xl-2 col-md-3 col-sm-6 col-12">
          <div className="col p-2">
            <Heading title={<span>{t("Description")}</span>} />
          </div>
          <p>{t("No protective movement or normal position")}</p>
          <p>{t("Slow, cautious movement, touching or rubbing pain site")}</p>
          <p>{t("Pulling tube, moving limbs, striking at staff")}</p>
        </div>
        <div className="col-xl-2 col-md-3 col-sm-6 col-12">
          <div className="col p-2">
            <Heading title={<span>{t("Your Score")}</span>} />
          </div>
          <Input
            type="number"
            min="0"
            max="2"
            className="form-control"
            id="bodyMovements"
            lable={t("Your Score")}
            placeholder=" "
            required={true}
            value={values?.bodyMovements}
            respclass="col-xl-4 col-md-4 col-sm-6 col-12"
            name="bodyMovements"
            onChange={handleChange}
          />
        </div>
      </div>

      {/* Ventilator/Vocalization Section */}
      <Heading title={<span>{t("Ventilator / Vocalization")}</span>} />
      <div className="row p-2 border rounded mb-3">
        <div className="col-xl-2 col-md-3 col-sm-6 col-12">
          <div className="col p-2">
            <Heading title={<span>{t("Indicator")}</span>} />
          </div>
          <p>{t("Tolerating ventilator or movement")}</p>
          <p>{t("Coughing but tolerating")}</p>
          <p>{t("Fighting ventilator")}</p>
          <p>{t("Talking in normal tone or no sound")}</p>
          <p>{t("Sighing, moaning")}</p>
          <p>{t("Crying out, sobbing")}</p>
        </div>
        <div className="col-xl-2 col-md-3 col-sm-6 col-12">
          <div className="col p-2">
            <Heading title={<span>{t("Score")}</span>} />
          </div>
          <p>0</p>
          <p>1</p>
          <p>2</p>
          <p>0</p>
          <p>1</p>
          <p>2</p>
        </div>
        <div className="col-xl-2 col-md-3 col-sm-6 col-12">
          <div className="col p-2">
            <Heading title={<span>{t("Description")}</span>} />
          </div>
          <p>{t("Alarms not activated, easy ventilation")}</p>
          <p>{t("Coughing, alarms may activate but stop spontaneously")}</p>
          <p>{t("Blocking ventilation, frequent alarms")}</p>
          <p>{t("Talking in normal tone or no sound")}</p>
          <p>{t("Sighing, moaning")}</p>
          <p>{t("Crying out, sobbing")}</p>
        </div>
        <div className="col-xl-2 col-md-3 col-sm-6 col-12">
          <div className="col p-2">
            <Heading title={<span>{t("Your Score")}</span>} />
          </div>
          <Input
            type="number"
            min="0"
            max="2"
            className="form-control"
            id="ventilator"
            lable={t("Your Score")}
            placeholder=" "
            required={true}
            value={values?.ventilator}
            respclass="col-xl-4 col-md-4 col-sm-6 col-12"
            name="ventilator"
            onChange={handleChange}
          />
        </div>
      </div>

      {/* Muscle Tension Section */}
      <Heading title={<span>{t("Muscle Tension")}</span>} />
      <div className="row p-2 border rounded mb-3">
        <div className="col-xl-2 col-md-3 col-sm-6 col-12">
          <div className="col p-2">
            <Heading title={<span>{t("Indicator")}</span>} />
          </div>
          <p>{t("Relaxed")}</p>
          <p>{t("Tense / Rigid")}</p>
          <p>{t("Very tense or rigid")}</p>
        </div>
        <div className="col-xl-2 col-md-3 col-sm-6 col-12">
          <div className="col p-2">
            <Heading title={<span>{t("Score")}</span>} />
          </div>
          <p>0</p>
          <p>1</p>
          <p>2</p>
        </div>
        <div className="col-xl-2 col-md-3 col-sm-6 col-12">
          <div className="col p-2">
            <Heading title={<span>{t("Description")}</span>} />
          </div>
          <p>{t("No resistance to passive movements")}</p>
          <p>{t("Resistance to passive movements")}</p>
          <p>{t("Strong resistance to passive movements")}</p>
        </div>
        <div className="col-xl-2 col-md-3 col-sm-6 col-12">
          <div className="col p-2">
            <Heading title={<span>{t("Your Score")}</span>} />
          </div>
          <Input
            type="number"
            min="0"
            max="2"
            className="form-control"
            id="muscleTension"
            lable={t("Your Score")}
            placeholder=" "
            required={true}
            value={values?.muscleTension}
            respclass="col-xl-4 col-md-4 col-sm-6 col-12"
            name="muscleTension"
            onChange={handleChange}
          />
        </div>
      </div>

      {/* Total Score and Extubated Patients */}
      <div className="row p-2 border rounded mb-3">
        <div className="col-xl-3 col-md-4 col-sm-6 col-12">
          <Heading title={<span>{t("TOTAL CPOT SCORE")}</span>} />
          <Input
            type="text"
            className="form-control"
            id="total"
            lable={t(`Total CPOT Score (${values.total} / 8)`)}
            placeholder=" "
            required={true}
            value={values?.total}
            respclass="col-xl-12"
            name="total"
            readOnly={true}
            disabled={true}
          />
        </div>
        <div className="col-xl-3 col-md-4 col-sm-6 col-12">
          <Heading title={<span>{t("Extubated Patients")}</span>} />
          <Input
            type="select"
            className="form-control"
            id="extubatedpatients"
            lable={t("Extubated Patients")}
            required={true}
            value={values?.extubatedpatients}
            respclass="col-xl-12"
            name="extubatedpatients"
            onChange={handleChange}
            options={[
              { value: "0", label: t("No") },
              { value: "1", label: t("Yes") },
            ]}
          />
        </div>
      </div>

      <div className="row mb-3">
        <div className="col-12 d-flex justify-content-end gap-2">
          <button
            className={`btn ${isEditMode ? "btn-warning" : "btn-success"} mr-2`}
            onClick={handleSave}
          >
            {isEditMode ? t("Update") : t("Save")}
          </button>

          {/* Cancel */}
          <button className="btn btn-secondary" onClick={handleCancel}>
            {t("Cancel")}
          </button>
        </div>
      </div>

      {/* Table Section */}
      {tableData.length > 0 ? (
        <Tables
          thead={CPOTRECORDS}
          tbody={tableData.map((row, index) => ({
            "Sr.No": index + 1,
            Facial: row.FacialExpression || "-",
            Body: row.BodyMovements || "-",
            Ventilator: row.Vocalization || "-",
            Muscle: row.MuscleTension || "-",
            Total: row.TOTAL || "0",
            "Created By": row.CreatedBy || "-",
            "Created Date": row.CreatedDate || "-",
            Edit: (
              <i
                className="bi bi-pencil-square"
                style={{ cursor: "pointer", color: "#007bff" }}
                onClick={() => handleEdit(row)}
                title={t("Edit Record")}
              />
            ),
          }))}
        />
      ) : (
        <div className="alert alert-info">
          {t("No CPOT records found for this patient.")}
        </div>
      )}
    </>
  );
};

export default CPOT;
