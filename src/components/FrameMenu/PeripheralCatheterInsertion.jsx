import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import moment from "moment";

import Input from "../formComponent/Input";
import DatePicker from "../formComponent/DatePicker";
import LabeledInput from "../formComponent/LabeledInput";
import Tables from "../UI/customTable";
import Heading from "../UI/Heading";

import { notify } from "../../utils/utils";
import {
  peripheralBindDetailsApi,
  peripheralSaveDataApi,
} from "../../networkServices/nursingWardAPI";

const PeripheralCatheterInsertion = ({ data }) => {
  const { t } = useTranslation();
  const { patientID, transactionID } = data;
  const [form, setForm] = useState({
    id: 0,
    date: new Date(),
    time: "",
    insertedBy: "",
    location: "",
    leftCatheterGauge: "",
    reason: "",
    cleanedWith: "",
    insertionEase: "",
    complianceLevel: "",
    appearence: "",
    flushedWith: "",
    checkedBy: "",
  });

  const [tableData, setTableData] = useState([]);
  const [isEdit, setIsEdit] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      const payload = {
        id: form.id,
        date: moment(form.date).format("YYYY-MM-DD"),
        time: form.time,

        insertedBy: form.insertedBy,
        location: form.location,
        leftCatheterGauge: form.leftCatheterGauge,
        reason: form.reason,

        cleanedWith: form.CatheterSiteCleanedWith?.trim() || "N/A",

        insertionEase: form.insertionEase,
        complianceLevel: form.complianceLevel,
        appearence: form.appearence,
        flushedWith: form.flushedWith,
        checkedBy: form.checkedBy,

        saveType: form.id ? "Update" : "Save",
        patientId: patientID,
        transactionId: transactionID,
      };

      const res = await peripheralSaveDataApi(payload);

      if (res?.success) {
        notify(res.message, "success");
        resetForm();
        fetchData();
      } else notify(res.message, "error");
    } catch {
      notify(res.message, "error");
    }
  };

  const resetForm = () => {
    setForm({
      id: 0,
      date: new Date(),
      time: "",
      insertedBy: "",
      location: "",
      leftCatheterGauge: "",
      reason: "",
      cleanedWith: "",
      insertionEase: "",
      complianceLevel: "",
      appearence: "",
      flushedWith: "",
      checkedBy: "",
    });
    setIsEdit(false);
  };

  const handleEdit = (item) => {
    setForm({
      id: item.ID,
      date: new Date(item.Date),
      time: item?.Time || "",
      insertedBy: item?.InsertedBy || "",
      location: item?.Location || "",
      leftCatheterGauge: item?.LeftCatheterGauge || "",
      reason: item?.Reason || "",
      cleanedWith: item?.CatheterSiteCleanedWith || "",
      insertionEase: item?.InsertionEase || "",
      complianceLevel: item?.ComplianceLevel || "",
      appearence: item?.Appearence || "",
      flushedWith: item?.FlushedWith || "",
      checkedBy: item?.CheckedBy1 || "",
    });
    setIsEdit(true);
  };

  const fetchData = async () => {
    const res = await peripheralBindDetailsApi(patientID, transactionID);

    if (res?.success && res.data?.length) {
      setTableData(res.data);

      const firstRow = res.data[0];

      setForm((prev) => ({
        ...prev,
        date: firstRow.Date ? new Date(firstRow.Date) : new Date(),
        time: firstRow.Time || "",
        checkedBy: firstRow?.CheckedBy1 || "",
      }));
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const THEAD = [
    { name: t("S.No.") },
    { name: t("Inserted By") },
    { name: t("Location") },
    { name: t("Gauge") },
    { name: t("Reason") },
    { name: t("Cleaned With") },
    { name: t("Insertion Ease") },
    { name: t("Compliance") },
    { name: t("Appearance") },
    { name: t("Flushed With") },
    { name: t("Checked By") },
    { name: t("Date") },
    { name: t("Time") },
    { name: t("Edit") },
  ];
  const FORM_THEAD = [
    { name: t("Sr. No."), width: "3%" },
    { name: t("Details.") },
    { name: t("Response.") },
  ];
  const FORM_TBODY = [
    ["Name Of Person Inserting", "insertedBy"],
    ["Location Of Peripheral Catheter", "location"],
    ["Catheter Gauge", "leftCatheterGauge"],
    ["Reason for Catheter Insertion", "reason"],
    ["Catheter site cleaned with", "cleanedWith"],
    ["Ease of Insertion of Catheter", "insertionEase"],
    ["Patient Compliance Level", "complianceLevel"],
    ["Appearance of Catheter site", "appearence"],
    ["Catheter Flushed With", "flushedWith"],
    ["Checked By", "checkedBy"],
  ].map(([label, name], index) => ({
    "Sr. No.": index + 1,
    Details: t(label),
    Response: (
      <Input
        name={name}
        value={form[name]}
        onChange={handleChange}
        className="form-control"
        disabled={name === "checkedBy"}
      />
    ),
  }));

  return (
    <div className="patient_registration card mt-2">
      <Heading title={t("PERIPHERAL CATHETER INSERTION")} />
      <div className="row row-cols-lg-6 row-cols-md-3 row-cols-1 p-2">
        <DatePicker
          name="date"
          lable={t("Date")}
          value={form.date}
          handleChange={handleChange}
        />

        <LabeledInput
          label={t("Time")}
          name="time"
          value={form.time}
          onChange={handleChange}
        />
      </div>
      <Tables thead={FORM_THEAD} tbody={FORM_TBODY} />

      <div className="text-end p-2">
        <button className="btn btn-primary" onClick={handleSave}>
          {isEdit ? t("Update") : t("Save")}
        </button>
        {isEdit && (
          <button className="btn btn-secondary ms-2" onClick={resetForm}>
            {t("Cancel")}
          </button>
        )}
      </div>

      {tableData.length > 0 && (
        <Tables
          thead={THEAD}
          tbody={tableData.map((item, i) => ({
            "S.No.": i + 1,
            "Inserted By": item?.InsertedBy || "",
            Location: item?.Location || "",
            Gauge: item?.LeftCatheterGauge || "",
            Reason: item?.Reason || "",
            "Cleaned With": item?.CatheterSiteCleanedWith || "",
            "Insertion Ease": item?.InsertionEase || "",
            Compliance: item?.ComplianceLevel || "",
            Appearance: item?.Appearence || "",
            "Flushed With": item?.FlushedWith || "",
            "Checked By": item?.CheckedBy1 || "",
            Date: moment(item.Date).format("DD-MM-YYYY"),
            Time: item.Time,
            Edit: (
              <i
                className="fa fa-edit text-primary"
                style={{ cursor: "pointer" }}
                onClick={() => handleEdit(item)}
              />
            ),
          }))}
          scrollView={"scrollView"}
        />
      )}
    </div>
  );
};

export default PeripheralCatheterInsertion;
