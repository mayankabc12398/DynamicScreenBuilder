import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Tables from "../UI/customTable";
import Input from "../formComponent/Input";
import {
  bindDataLaboratoryApi,
  saveLaboratoryApi,
} from "../../networkServices/nursingWardAPI";
import { notify } from "../../utils/utils";
import DatePicker from "../formComponent/DatePicker";
import moment from "moment";

const  Laboratory = ({ data }) => {
  const { t } = useTranslation();
  const { transactionID, patientID } = data;
  const { VITE_DATE_FORMAT } = import.meta.env;

  const THEAD = [
    { name: t("Sr.No"), width: "5%" },
    { name: t("ITEMS"), width: "35%" },
    { name: t("DONE"), width: "28%" },
    { name: t("NOT DONE"), width: "" },
    { name: t("ACTION / COMMENTS"), width: "" },
  ];

  const tableItems = [
    {
      type: "row",
      label: "Urea, Electrolytes & Creatinine",
      payloadKeys: {
        done: "lab_Done1",
        dateDone: "labDate_Done1",
        notDone: "lab_NotDone1",
        comment: "lab_Comment1",
      },
    },
    {
      type: "row",
      label: "Full Haemogram",
      payloadKeys: {
        done: "lab_Done2",
        dateDone: "labDate_Done2",
        notDone: "lab_NotDone2",
        comment: "lab_Comment2",
      },
    },
    {
      type: "row",
      label: "Blood grouping & Cross match (6 Units Whole blood, 4 Units FFP)",
      payloadKeys: {
        done: "lab_Done3",
        dateDone: "labDate_Done3",
        notDone: "lab_NotDone3",
        comment: "lab_Comment3",
      },
    },
    {
      type: "row",
      label: "Urinalysis",
      payloadKeys: {
        done: "lab_Done4",
        dateDone: "labDate_Done4",
        notDone: "lab_NotDone4",
        comment: "lab_Comment4",
      },
    },
    {
      type: "row",
      label: "INR if patient has been taking warfarin",
      payloadKeys: {
        done: "lab_Done5",
        dateDone: "labDate_Done5",
        notDone: "lab_NotDone5",
        comment: "lab_Comment5",
      },
    },
    {
      type: "row",
      label: "PDT for adult female patients",
      payloadKeys: {
        done: "lab_Done6",
        dateDone: "labDate_Done6",
        notDone: "lab_NotDone6",
        comment: "lab_Comment6",
      },
    },

    {
      type: "row",
      label: "HIV screening",
      payloadKeys: {
        done: "lab_Done7",
        dateDone: "labDate_Done7",
        notDone: "lab_NotDone7",
        comment: "lab_Comment7",
      },
    },
    {
      type: "row",
      label: "Hepatitis B & C screening",
      payloadKeys: {
        done: "lab_Done8",
        dateDone: "labDate_Done8",
        notDone: "lab_NotDone8",
        comment: "lab_Comment8",
      },
    },
    {
      type: "row",
      label: "Coagulation Screen",
      payloadKeys: {
        done: "lab_Done9",
        dateDone: "labDate_Done9",
        notDone: "lab_NotDone9",
        comment: "lab_Comment9",
      },
    },
    {
      type: "row",
      label: "Ensure enough donors for the patient",
      payloadKeys: {
        done: "lab_Done10",
        dateDone: "labDate_Done10",
        notDone: "lab_NotDone10",
        comment: "lab_Comment10",
      },
    },

    { type: "section", label: "Intra Operative" },

    {
      type: "row",
      label:
        <span>"Coagulation screen may be done during operation <br/>{t("if indicated but is not routine for all patients\"")}</span>,
      payloadKeys: {
        done: "lab_Done11",
        dateDone: "labDate_Done11",
        notDone: "lab_NotDone11",
        comment: "lab_Comment11",
      },
    },

    {
      type: "section",
      label: "Post Operative",
    },

    {
      type: "row",
      label: "Check hemoglobin",
      payloadKeys: {
        done: "lab_Done12",
        dateDone: "labDate_Done12",
        notDone: "lab_NotDone12",
        comment: "lab_Comment12",
      },
    },
    {
      type: "row",
      label: "Coagulation Screen",
      payloadKeys: {
        done: "lab_Done13",
        dateDone: "labDate_Done13",
        notDone: "lab_NotDone13",
        comment: "lab_Comment13",
      },
    },
    {
      type: "row",
      label:
        "Other tests will be dictated by the patient's condition and response to treatment",
      payloadKeys: {
        done: "lab_Done14",
        dateDone: "labDate_Done14",
        notDone: "lab_NotDone14",
        comment: "lab_Comment14",
      },
    },
    { type: "row", label: "Nurse" },
  ];

  const [payload, setPayload] = useState({
    lab_Done1: "",
    labDate_Done1: "",
    lab_NotDone1: "",
    lab_Comment1: "",

    lab_Done2: "",
    labDate_Done2: "",
    lab_NotDone2: "",
    lab_Comment2: "",

    lab_Done3: "",
    labDate_Done3: "",
    lab_NotDone3: "",
    lab_Comment3: "",

    lab_Done4: "",
    labDate_Done4: "",
    lab_NotDone4: "",
    lab_Comment4: "",

    lab_Done5: "",
    labDate_Done5: "",
    lab_NotDone5: "",
    lab_Comment5: "",

    lab_Done6: "",
    labDate_Done6: "",
    lab_NotDone6: "",
    lab_Comment6: "",

    lab_Done7: "",
    labDate_Done7: "",
    lab_NotDone7: "",
    lab_Comment7: "",

    lab_Done8: "",
    labDate_Done8: "",
    lab_NotDone8: "",
    lab_Comment8: "",

    lab_Done9: "",
    labDate_Done9: "",
    lab_NotDone9: "",
    lab_Comment9: "",

    lab_Done10: "",
    labDate_Done10: "",
    lab_NotDone10: "",
    lab_Comment10: "",

    lab_Done11: "",
    labDate_Done11: "",
    lab_NotDone11: "",
    lab_Comment11: "",

    lab_Done12: "",
    labDate_Done12: "",
    lab_NotDone12: "",
    lab_Comment12: "",

    lab_Done13: "",
    labDate_Done13: "",
    lab_NotDone13: "",
    lab_Comment13: "",

    lab_Done14: "",
    labDate_Done14: "",
    lab_NotDone14: "",
    lab_Comment14: "",

    nurse: "",
    pid: "",
    tid: "",
  });

  const [isRecordExist, setIsRecordExist] = useState(false);

  const fetchList = async () => {
    const res = await bindDataLaboratoryApi(transactionID, patientID);

    if (!res?.success) {
      setIsRecordExist(false);
      return;
    }

    const d = res.data[0];

    setPayload({
      lab_Done1: d.Item1_Done || "",
      labDate_Done1: d.Item1_Date ? new Date(d.Item1_Date) : null,
      lab_NotDone1: d.Item1_NotDone || "",
      lab_Comment1: d.Item1_Comment || "",

      lab_Done2: d.Item2_Done || "",
      labDate_Done2: d.Item2_Date ? new Date(d.Item2_Date) : null,
      lab_NotDone2: d.Item2_NotDone || "",
      lab_Comment2: d.Item2_Comment || "",

      lab_Done3: d.Item3_Done || "",
      labDate_Done3: d.Item3_Date ? new Date(d.Item3_Date) : null,
      lab_NotDone3: d.Item3_NotDone || "",
      lab_Comment3: d.Item3_Comment || "",

      lab_Done4: d.Item4_Done || "",
      labDate_Done4: d.Item4_Date ? new Date(d.Item4_Date) : null,
      lab_NotDone4: d.Item4_NotDone || "",
      lab_Comment4: d.Item4_Comment || "",

      lab_Done5: d.Item5_Done || "",
      labDate_Done5: d.Item5_Date ? new Date(d.Item5_Date) : null,
      lab_NotDone5: d.Item5_NotDone || "",
      lab_Comment5: d.Item5_Comment || "",

      lab_Done6: d.Item6_Done || "",
      labDate_Done6: d.Item6_Date ? new Date(d.Item6_Date) : null,
      lab_NotDone6: d.Item6_NotDone || "",
      lab_Comment6: d.Item6_Comment || "",

      lab_Done7: d.Item7_Done || "",
      labDate_Done7: d.Item7_Date ? new Date(d.Item7_Date) : null,
      lab_NotDone7: d.Item7_NotDone || "",
      lab_Comment7: d.Item7_Comment || "",

      lab_Done8: d.Item8_Done || "",
      labDate_Done8: d.Item8_Date ? new Date(d.Item8_Date) : null,
      lab_NotDone8: d.Item8_NotDone || "",
      lab_Comment8: d.Item8_Comment || "",

      lab_Done9: d.Item9_Done || "",
      labDate_Done9: d.Item9_Date ? new Date(d.Item9_Date) : null,
      lab_NotDone9: d.Item9_NotDone || "",
      lab_Comment9: d.Item9_Comment || "",

      lab_Done10: d.Item10_Done || "",
      labDate_Done10: d.Item10_Date ? new Date(d.Item10_Date) : null,
      lab_NotDone10: d.Item10_NotDone || "",
      lab_Comment10: d.Item10_Comment || "",

      lab_Done11: d.Item11_Done || "",
      labDate_Done11: d.Item11_Date ? new Date(d.Item11_Date) : null,
      lab_NotDone11: d.Item11_NotDone || "",
      lab_Comment11: d.Item11_Comment || "",

      lab_Done12: d.Item12_Done || "",
      labDate_Done12: d.Item12_Date ? new Date(d.Item12_Date) : null,
      lab_NotDone12: d.Item12_NotDone || "",
      lab_Comment12: d.Item12_Comment || "",

      lab_Done13: d.Item13_Done || "",
      labDate_Done13: d.Item13_Date ? new Date(d.Item13_Date) : null,
      lab_NotDone13: d.Item13_NotDone || "",
      lab_Comment13: d.Item13_Comment || "",

      lab_Done14: d.Item14_Done || "",
      labDate_Done14: d.Item14_Date ? new Date(d.Item14_Date) : null,
      lab_NotDone14: d.Item14_NotDone || "",
      lab_Comment14: d.Item14_Comment || "",

      nurse: d.Nurse || "",
      pid: patientID,
      tid: transactionID,
    });

    setIsRecordExist(true);
  };

  useEffect(() => {
    fetchList();
  }, []);

  const handleSave = async () => {
    const savePayload = {
      pid: patientID,
      tid: transactionID,
      Nurse: payload.nurse,
    };

    tableItems.forEach((item) => {
      if (item.type === "row" && item.payloadKeys) {
        const { done, dateDone, notDone, comment } = item.payloadKeys;

        savePayload[done] = payload[done] || "";
        savePayload[dateDone] = payload[dateDone]
          ? moment(payload[dateDone]).toISOString()
          : "";

        savePayload[notDone] = payload[notDone] || "";
        savePayload[comment] = payload[comment] || "";
      }
    });

    const res = await saveLaboratoryApi(savePayload);

    if (res?.success) {
      notify(res.message, "success");
      fetchList();
    }
  };

  const handleChange = (name, value) => {
    setPayload((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  let srNo = 1;

  const TBODY = tableItems.map((item) => {
    if (item.type === "section") {
      return {
        "Sr.No": "",
        ITEMS: <b>{item.label}</b>,
        DONE: "",
        "NOT DONE": "",
        "ACTION / COMMENTS": "",
      };
    }

    if (item.label === "Nurse") {
      return {
        "Sr.No": srNo++,
        ITEMS: item.label,
        DONE: (
          <Input
            type="text"
            className="form-control"
            value={payload.nurse}
            onChange={(e) =>
              setPayload((prev) => ({ ...prev, nurse: e.target.value }))
            }
          />
        ),
        "NOT DONE": "",
        "ACTION / COMMENTS": "",
      };
    }

    const { done, dateDone, notDone, comment } = item.payloadKeys;

    return {
      "Sr.No": srNo++,
      ITEMS: item.label,

      DONE: (
        <div className="row">
          <Input
            type="text"
            respclass={"col-xl-6 col-lg-6 col-md-6 col-6"}
            className="form-control"
            value={payload[done]}
            onChange={(e) => handleChange(done, e.target.value)}
          />
          <DatePicker
            className="custom-calender"
            respclass={"col-xl-6 col-lg-6 col-md-6 col-6"}
            placeholder={VITE_DATE_FORMAT}
            value={payload[dateDone]}
            handleChange={(e) => handleChange(dateDone, e.target.value)}
          />
        </div>
      ),

      "NOT DONE": (
        <Input
          type="text"
          className="form-control"
          value={payload[notDone]}
          onChange={(e) => handleChange(notDone, e.target.value)}
        />
      ),

      "ACTION / COMMENTS": (
        <Input
          type="text"
          className="form-control"
          value={payload[comment]}
          onChange={(e) => handleChange(comment, e.target.value)}
        />
      ),
    };
  });

  return (
    <>
      <div className="patient_registration card mt-2">
        <Tables thead={THEAD} tbody={TBODY} tableHeight="tableHeight" />
      </div>

      <div className="d-flex justify-content-end mt-2 mb-2">
        <button type="button" className="btn btn-primary" onClick={handleSave}>
          {isRecordExist ? t("Update") : t("Save")}
        </button>
      </div>
    </>
  );
};

export default Laboratory;
