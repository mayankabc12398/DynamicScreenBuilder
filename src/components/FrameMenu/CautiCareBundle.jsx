import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import LabeledInput from "../formComponent/LabeledInput";
import moment from "moment";
import Tables from "../UI/customTable";
import DatePicker from "../formComponent/DatePicker";
import Heading from "../UI/Heading";
import { notify } from "../../utils/utils";
import {
  cautiCareBundleBindDetailsApi,
  cautiCareBundleSaveDataApi,
  cautiCareBundleUpdateDataApi,
} from "../../networkServices/nursingWardAPI";
import CustomSelect from "../formComponent/CustomSelect";

const CautiCareBundle = ({ data }) => {
  const { t } = useTranslation();
  const { patientID, transactionID } = data;
  const [form, setForm] = useState({
    id: 0,
    date: new Date(),
    time: "",
    thePatient: "",
    theUrinary: "",
    dailyMeatal: "",
    urinaryCatheter: "",
    handHygiene: "",
    patientAnd: "",
    patientID: "",
    transactionID: "",
    checkedBy: "",
  });

  const [tableData, setTableData] = useState([]);
  const [isEdit, setIsEdit] = useState(false);

  const yesNoOptions = [
    { label: t("Yes"), value: 1 },
    { label: t("No"), value: 0 },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelect = (name, val) => {
    setForm((prev) => ({ ...prev, [name]: val }));
  };
  const getYesNoOption = (val) => {
    return val === 1 ? yesNoOptions[0] : yesNoOptions[1];
  };

  const FORM_TBODY = [
    {
      label:
        "The Patient has been assessed of continual need of Urinary Catheter",
      name: "thePatient",
      type: "select",
    },
    {
      label: "The Urinary Catheter has been continuously connected",
      name: "theUrinary",
      type: "select",
    },
    {
      label: "Daily Meatal Hygiene has been performed on the patient",
      name: "dailyMeatal",
      type: "select",
    },
    {
      label:
        "Urinary Catheter bag has been emptied routinely into clean container",
      name: "urinaryCatheter",
      type: "select",
    },
    {
      label:
        "Hand Hygiene performed and gloves worn before and after procedure",
      name: "handHygiene",
      type: "select",
    },
    {
      label: "Patient and/or care taker sensitized on catheter care",
      name: "patientAnd",
      type: "select",
    },
    {
      label: "Checked By",
      name: "checkedBy",
      type: "input",
    },
  ].map((item, index) => ({
    "Sr. No.": index + 1,
    "Bundle Criteria": t(item.label),
    Response:
      item.type === "select" ? (
        <CustomSelect
          name={item.name}
          option={yesNoOptions}
          value={form[item.name]?.value}
          onChange={handleSelect}
          placeHolder="Select"
          isRemoveSearchable={true}
        />
      ) : (
        <input
          type="text"
          name={item.name}
          value={form[item.name]}
          onChange={handleChange}
          className="form-control"
          placeholder={t("Checked By")}
        />
      ),
  }));

  const handleSave = async () => {
    try {
      const payload = {
        date: form.date ? moment(form.date).format("YYYY-MM-DD") : "",
        time: form.time || "",

        thePatient: form.thePatient?.value || "",
        theUrinary: form.theUrinary?.value || "",
        dailyMeatal: form.dailyMeatal?.value || "",
        urinaryCatheter: form.urinaryCatheter?.value || "",
        handHygiene: form.handHygiene?.value || "",
        patientAnd: form.patientAnd?.value || "",

        patientId: patientID || "",
        transactionId: transactionID || "",
        checkedBy: form.checkedBy || "",
      };

      const response = await cautiCareBundleSaveDataApi(payload);

      if (response?.success) {
        notify(response?.message || "Saved successfully", "success");

        setForm({
          id: 0,
          date: new Date(),
          time: "",
          thePatient: "",
          theUrinary: "",
          dailyMeatal: "",
          urinaryCatheter: "",
          handHygiene: "",
          patientAnd: "",
          patientID: patientID || "",
          transactionID: transactionID || "",
        });

        fetchData();
      } else {
        notify(response?.message || "Save failed", "error");
      }
    } catch (error) {
      console.error(error);
      notify(t("Something went wrong"), "error");
    }
  };
  const handleEdit = (item) => {
    setForm({
      id: item.ID,
      date: item.Date ? new Date(item.Date) : new Date(),
      time: item.Time || "",

      thePatient: getYesNoOption(item.ThePatient),
      theUrinary: getYesNoOption(item.TheUrinary),
      dailyMeatal: getYesNoOption(item.DailyMeatal),
      urinaryCatheter: getYesNoOption(item.UrinaryCatheter),
      handHygiene: getYesNoOption(item.HandHygiene),
      patientAnd: getYesNoOption(item.PatientAnd),

      checkedBy: item.CheckedBy1 || "",
    });

    setIsEdit(true);
  };

  const handleUpdate = async () => {
    try {
      const payload = {
        id: form.id,
        date: form.date ? moment(form.date).format("YYYY-MM-DD") : "",
        time: form.time || "",

        thePatient: form.thePatient?.value || "",
        theUrinary: form.theUrinary?.value || "",
        dailyMeatal: form.dailyMeatal?.value || "",
        urinaryCatheter: form.urinaryCatheter?.value || "",
        handHygiene: form.handHygiene?.value || "",
        patientAnd: form.patientAnd?.value || "",

        patientID,
        transactionID,
      };

      const response = await cautiCareBundleUpdateDataApi(payload);

      if (response?.success) {
        notify(response?.message || "Updated successfully", "success");

        setForm({
          id: 0,
          date: new Date(),
          time: "",
          thePatient: "",
          theUrinary: "",
          dailyMeatal: "",
          urinaryCatheter: "",
          handHygiene: "",
          patientAnd: "",
          patientID: patientID || "",
          transactionID: transactionID || "",
        });

        fetchData();
      } else {
        notify(response?.message || "Update failed", "error");
      }
    } catch (error) {
      console.error(error);
      notify(t("Something went wrong"), "error");
    }
  };

  const fetchData = async () => {
    const res = await cautiCareBundleBindDetailsApi(patientID, transactionID);

    if (res?.success) {
      setTableData(res.data || []);

      if (res.data?.length) {
        const firstRow = res.data[0];
        setForm((prev) => ({
          ...prev,
          date: firstRow.Date ? new Date(firstRow.Date) : new Date(),
          time: firstRow.Time || "",
          checkedBy: firstRow.EmpName || "",
        }));
      }
    } else {
      notify(res?.message, "error");
      setTableData([]);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const THEAD = [
    { name: t("S.No.") },
    { name: t("ThePatient") },
    { name: t("TheUrinary") },
    { name: t("DailyMeatal") },
    { name: t("UrinaryCatheter") },
    { name: t("HandHygiene") },
    { name: t("PatientAnd") },
    { name: t("Checked By   )") },
    { name: t("UHID") },
    { name: t("Date") },
    { name: t("Time") },
    { name: t("Edit") },
  ];

  const FORM_THEAD = [
    { name: t("Sr. No."), width: "3%" },
    { name: t("Bundle Criteria") },
    { name: t("Response") },
  ];

  return (
    <div className="mt-2 spatient_registration_card">
      <div className="patient_registration card">
        <Heading title={t("Cauti Care Bundle")} />
        <div className="row row-cols-lg-6 row-cols-md-3 row-cols-1 p-2">
          <DatePicker
            name="date"
            lable={t("Date")}
            value={form?.date}
            handleChange={handleChange}
            respclass="col-xl-2 col-md-4 col-12"
          />

          <LabeledInput
            label={t("Time")}
            name="time"
            value={form?.time}
            onChange={handleChange}
          />
        </div>
        <Tables thead={FORM_THEAD} tbody={FORM_TBODY} />

        <div className="col-12 d-flex justify-content-end mb-2">
          {!isEdit ? (
            <button className="btn btn-primary" onClick={handleSave}>
              {t("Save")}
            </button>
          ) : (
            <button className="btn btn-warning" onClick={handleUpdate}>
              {t("Update")}
            </button>
          )}
        </div>
      </div>

      {tableData.length > 0 && (
        <Tables
          thead={THEAD}
          tbody={tableData.map((item, index) => ({
            "S.No.": index + 1,
            ThePatient: item?.ThePatient1 || "",
            TheUrinary: item?.TheUrinary1 || "",
            DailyMeatal: item?.DailyMeatal1 || "",
            UrinaryCatheter: item?.UrinaryCatheter1 || "",
            HandHygiene: item?.HandHygiene1 || "",
            PatientAnd: item?.PatientAnd1 || "",
            "Checked By": item?.CheckedBy1 || "",
            UHID: item?.PatientID || "",
            Date: item?.Date1 || "",
            Time: item?.Time1 || "",
            Edit: (
              <i
                className="fa fa-edit text-primary"
                style={{ cursor: "pointer" }}
                onClick={() => handleEdit(item)}
              />
            ),
          }))}
        />
      )}
    </div>
  );
};

export default CautiCareBundle;
