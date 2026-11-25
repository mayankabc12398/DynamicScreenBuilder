import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Heading from "../UI/Heading";
import Input from "../formComponent/Input";
import {
  NursingWardSaveTurningChart,
  NursingWardUpdateTurningChart,
  NursingWardGetTurningChart,
} from "../../networkServices/nursingWardAPI";
import Tables from "../UI/customTable";
import { notify } from "../../utils/utils";

const TurningChart = ({ data, onClose }) => {
  const [t] = useTranslation();
  const [values, setValues] = useState({
    dateTime: new Date().toISOString().slice(0, 16),
    prone: "",
    supine: "",
    rightLateral: "",
    leftLateral: "",
    skinIntegrityComments: "",
    initials: "",
    comments: "",
    type: "save",
  });
  const [tableData, setTableData] = useState([]);

  const NURSINGWARDTABLE = [
    { width: "1%", name: t("Sr.No") },
    { width: "5%", name: t("Date / Time") },
    { width: "5%", name: t("Prone") },
    { width: "5%", name: t("Supine") },
    { width: "5%", name: t("Right Lateral") },
    { width: "5%", name: t("Left Lateral") },
    { width: "8%", name: t("Skin Integrity") },
    { width: "3%", name: t("Initials") },
    { width: "5%", name: t("Created By") },
    { width: "3%", name: t("Edit") },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((val) => ({
      ...val,
      [name]: value,
    }));
  };

  useEffect(() => {
    console.log("useEffect triggered");
    console.log("Data inside useEffect:", data);
    fetchTableData();
  }, []);

  const fetchTableData = async () => {
    try {
      const transactionID = data?.transactionID;
      if (!transactionID) {
        notify(t("Transaction ID missing"), "error");
        return;
      }
      let response = await NursingWardGetTurningChart(transactionID);

      if (response?.success) {
        setTableData(response.data);
      } else {
        notify(response?.message, "error");
      }
    } catch (error) {
      notify(error?.message, "error");
    }
  };

  const handleSave = async () => {
    try {
      const payload = {
        id: 0,
        patientID: data?.patientID,
        transactionID: data?.transactionID,
        date: values.dateTime.split("T")[0],
        time: values.dateTime.split("T")[1],
        prone: values?.prone,
        supine: values?.supine,
        right_LATERAL: values?.rightLateral,
        left_LATERAL: values?.leftLateral,
        skin_INTEGRITY: values?.skinIntegrityComments,
        comments: values?.comments,
        initials: values?.initials,
        createdBy: "",
      };

      console.log("Payload sending to backend:", payload);

      let response = await NursingWardSaveTurningChart(payload);

      if (response?.success) {
        notify(t("Saved successfully"), "success");
        setValues({
          dateTime: new Date().toISOString().slice(0, 16),
          prone: "",
          supine: "",
          rightLateral: "",
          leftLateral: "",
          skinIntegrityComments: "",
          initials: "",
          comments: "",
          type: "save",
        });
        await fetchTableData();
      } else {
        notify(response?.message, "error");
      }
    } catch (error) {
      notify(error?.message, "error");
    }
  };

  const handleEdit = (row) => {
    setValues({
      id: row.ID,
      dateTime: `${row.Date}T${row.Time}`,
      prone: row.PRONE || "",
      supine: row.SUPINE || "",
      rightLateral: row.RIGHT_LATERAL || "",
      leftLateral: row.LEFT_LATERAL || "",
      skinIntegrityComments: row.SKIN_INTEGRITY || "",
      initials: row.INITIALS || "",
      comments: row.COMMENTS || "",
      type: "update",
    });
  };

  const handleUpdate = async () => {
    try {
      const payload = {
        id: values.id,
        patientID: data?.patientID,
        transactionID: data?.transactionID,
        date: values.dateTime.split("T")[0],
        time: values.dateTime.split("T")[1],
        prone: values?.prone,
        supine: values?.supine,
        right_LATERAL: values?.rightLateral,
        left_LATERAL: values?.leftLateral,
        skin_INTEGRITY: values?.skinIntegrityComments,
        comments: values?.comments,
        initials: values?.initials,
        createdBy: "",
      };
      console.log("Payload sending to backend:", payload);

      let response = await NursingWardUpdateTurningChart(payload);

      if (response?.success) {
        notify(t("Updated successfully"), "success");
        // Table data refresh karo
        await fetchTableData();
        // Form reset karo
        setValues({
          dateTime: new Date().toISOString().slice(0, 16),
          prone: "",
          supine: "",
          rightLateral: "",
          leftLateral: "",
          skinIntegrityComments: "",
          initials: "",
          comments: "",
          type: "save",
        });
      } else {
        notify(response?.message, "error");
      }
    } catch (error) {
      notify(error?.message, "error");
    }
  };

  const handlePrintForm = () => {
    window.print();
  };

  return (
    <div className="card">
      <Heading
        title={<span className="text-dark">{t("Turning Chart")}</span>}
        secondTitle={
          <button
            className="py-2"
            onClick={onClose}
            style={{ background: "none", border: "none" }}
          >
            ✕
          </button>
        }
      />
      <div className="row p-2">
        <Input
          type="datetime-local"
          className="form-control"
          id="dateTime"
          lable={t("Date / Time")}
          placeholder=" "
          required={true}
          value={values?.dateTime}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="dateTime"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          id="prone"
          lable={t("Prone")}
          placeholder=" "
          required={true}
          value={values?.prone}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="prone"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          id="supine"
          lable={t("Supine")}
          placeholder=" "
          required={true}
          value={values?.supine}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="supine"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          id="rightLateral"
          lable={t("Right Lateral")}
          placeholder=" "
          required={true}
          value={values?.rightLateral}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="rightLateral"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          id="leftLateral"
          lable={t("Left Lateral")}
          placeholder=" "
          required={true}
          value={values?.leftLateral}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="leftLateral"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          id="skinIntegrityComments"
          lable={t("Skin Integrity Comments")}
          placeholder=" "
          required={true}
          value={values?.skinIntegrityComments}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="skinIntegrityComments"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          id="initials"
          lable={t("Initials")}
          placeholder=" "
          required={true}
          value={values?.initials}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="initials"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          id="comments"
          lable={t("Comments")}
          placeholder=" "
          required={true}
          value={values?.comments}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="comments"
          onChange={handleChange}
        />
      </div>
      <div className="col-xl-12 col-md-12 col-sm-12 col-12 mb-2 px-2">
        {values?.type === "save" ? (
          <button
            type="button"
            className="btn btn-sm btn-primary mr-1"
            onClick={() => handleSave()}
          >
            {t("Save")}
          </button>
        ) : (
          <>
            <button
              type="button"
              className="btn btn-sm btn-primary mr-1"
              onClick={() => handleUpdate()}
            >
              {t("Update")}
            </button>
          </>
        )}
        <button
          type="button"
          className="btn btn-sm btn-primary ml-2"
          onClick={() => handlePrintForm()}
        >
          {t("Print")}
        </button>
      </div>
      {tableData.length > 0 && (
        <Tables
          thead={NURSINGWARDTABLE}
          tbody={tableData.map((row, index) => ({
            "Sr.No": index + 1,
            "Date / Time": `${row.Date} ${row.Time}`,
            Prone: row.PRONE || "-",
            Supine: row.SUPINE || "-",
            "Right Lateral": row.RIGHT_LATERAL || "-",
            "Left Lateral": row.LEFT_LATERAL || "-",
            "Skin Integrity": row.SKIN_INTEGRITY || "-",
            Initials: row.INITIALS || "-",
            "Created By": row.EnteredByName || "-",
            Edit: (
              <i
                className="bi bi-pencil-square"
                style={{ cursor: "pointer", color: "#007bff" }}
                onClick={() => handleEdit(row)}
              />
            ),
          }))}
        />
      )}
    </div>
  )
}

export default TurningChart