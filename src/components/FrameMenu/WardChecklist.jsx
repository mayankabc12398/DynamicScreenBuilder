import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Tables from "../UI/customTable";
import Input from "../formComponent/Input";
import DatePicker from "../formComponent/DatePicker";

import { notify } from "../../utils/utils";
import moment from "moment";
import {
  bindWardDataApi,
  save_WardApi,
} from "../../networkServices/nursingWardAPI";

const WardChecklist = ({ data }) => {
  const { transactionID, patientID } = data || {};
  const { t } = useTranslation();
  const { VITE_DATE_FORMAT } = import.meta.env;

  const tableItems = [
    {
      type: "row",
      label: <span>{t("Orient the patient on the ward layout")}</span>,
      payloadKeys: {
        done: "ward_Done1",
        dateDone: "ward_Date1",
        notDone: "ward_NotDone1",
        comment: "ward_Comment1",
      },
    },

    {
      type: "row",
      label: (
        <>
          <span className="fw-semibold">
            {t("Carry out patient education in preparation for")}
            <br /> {t("discharge this should include:")}
          </span>
          <ol className="mb-0 ps-3">
            <li>
              {t("Pathophysiology of disease(either coronary artery or valvular disease)")}
            </li>
            <li>
              {t("Risk factor modification to prevent CAD(smoking cessation,")} <br />
              {t("regular exercise and weight loss)")}
            </li>
            <li>
              post operative incision care-keep the incision site dry, clean,
              and avoid excessive dryness to prevent cracking
              <br />
              {t("could use some Petroleum jelly")}
            </li>
            <li>
              {t("Watch for any signs of wound infection, wound adhesion and see the")}{" "}
              <br />
              {t("doctor immediately if any of the above is noted")}
            </li>
            <li>
              {t("Activity limitations no lifting, no pushing or pulling of anything")}{" "}
              <br />
              {t("10lb for 6-8 wks; no driving for 6-8 wks")}
            </li>
            <li>{t("Recommended exercise progression after surgery")}</li>
            <li>{t("Recommended diet after surgery")}</li>
            <li>
              {t("h. Information regarding the prescribed medications,")}
              <br /> (including the pain medication) i.Anticipated mood changes
            </li>
          </ol>
        </>
      ),
      payloadKeys: {
        done: "ward_Done2",
        dateDone: "ward_Date2",
        notDone: "ward_NotDone2",
        comment: "ward_Comment2",
      },
    },

    {
      type: "row",
      label: (
        <>
          <span className="fw-semibold">
            {t("Perform a complete physical assessment upon ward admission")}
            <br />
            {t("Continue with daily observation to include:")}
          </span>
          <ol className="mb-0 ps-3">
            <li>{t("vital sign observation")}</li>
            <li>{t("operation site observation for any signs of infection")}</li>
            <li>{t("whether the wound is healing")}</li>
            <li>{t("the chest tube site for any ooze")}</li>
          </ol>
        </>
      ),
      payloadKeys: {
        done: "ward_Done3",
        dateDone: "ward_Date3",
        notDone: "ward_NotDone3",
        comment: "ward_Comment3",
      },
    },
    {
      type: "row",
      label: (
        <span>
          {t("Follow up appointment(2wks after surgery to see the surgeon/cardiologist")} <br />
          {t("then subsequent visits ReviewerDeestatseinstigations)")}
        </span>
      ),
      payloadKeys: {
        done: "ward_Done4",
        dateDone: "ward_Date4",
        notDone: "ward_NotDone4",
        comment: "ward_Comment4",
      },
    },
    {
      type: "row",
      label: (
        <>
          <span className="fw-semibold">
            {t("Additional information for valve patients:")}
          </span>
          <ol className="mb-0 ps-3">
            <li>{t("Symptoms of Endocarditis")}</li>
            <li>{t("Antibiotic prophylaxis before invasive procedures")}</li>
            <li>{t("whether the wound is healing")}</li>
            <li>{t("Anticoagulation information regarding therany and follow up")}</li>
          </ol>
        </>
      ),
      payloadKeys: {
        done: "ward_Done5",
        dateDone: "ward_Date5",
        notDone: "ward_NotDone5",
        comment: "ward_Comment5",
      },
    },
  ];

  const THEAD = [
    { name: t("Sr.No"), width: "5%" },
    { name: t("ITEMS"), width: "" },
    { name: t("DATE DONE"), width: "24%" },
    { name: t("NOT DONE"), width: "" },
    { name: t("ACTION / COMMENTS"), width: "11%" },
  ];

  const parseApiDate = (dateStr) => {
    if (!dateStr) return null;
    return new Date(dateStr);
  };

  const [payload, savePayload] = useState({
    ward_Done1: "",
    ward_Date1: "",
    ward_NotDone1: "",
    ward_Comment1: "",
    ward_Done2: "",
    ward_Date2: "",
    ward_NotDone2: "",
    ward_Comment2: "",
    ward_Done3: "",
    ward_Date3: "",
    ward_NotDone3: "",
    ward_Comment3: "",
    ward_Done4: "",
    ward_Date4: "",
    ward_NotDone4: "",
    ward_Comment4: "",
    ward_Done5: "",
    ward_Date5: "",
    ward_NotDone5: "",
    ward_Comment5: "",
    pid: "",
    tid: "",
  });

  const [isRecordExist, setIsRecordExist] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    savePayload((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const fetchWardData = async () => {
    const res = await bindWardDataApi(transactionID, patientID);
    if (res?.success && res.data?.length) {
      const r = res.data[0];
      savePayload({
        ward_Done1: r.Item1_Done || "",
        ward_Date1: parseApiDate(r.Item1_Date),
        ward_NotDone1: r.Item1_NotDone || "",
        ward_Comment1: r.Item1_Comment || "",

        ward_Done2: r.Item2_Done || "",
        ward_Date2: parseApiDate(r.Item2_Date),
        ward_NotDone2: r.Item2_NotDone || "",
        ward_Comment2: r.Item2_Comment || "",

        ward_Done3: r.Item3_Done || "",
        ward_Date3: parseApiDate(r.Item3_Date),
        ward_NotDone3: r.Item3_NotDone || "",
        ward_Comment3: r.Item3_Comment || "",

        ward_Done4: r.Item4_Done || "",
        ward_Date4: parseApiDate(r.Item4_Date),
        ward_NotDone4: r.Item4_NotDone || "",
        ward_Comment4: r.Item4_Comment || "",

        ward_Done5: r.Item5_Done || "",
        ward_Date5: parseApiDate(r.Item5_Date),
        ward_NotDone5: r.Item5_NotDone || "",
        ward_Comment5: r.Item5_Comment || "",

        pid: patientID,
        tid: transactionID,
      });

      setIsRecordExist(true);
    }
  };

  useEffect(() => {
    fetchWardData();
  }, []);
  const handleSave = async () => {
    const savePayload = {
      pid: patientID,
      tid: transactionID,
    };

    tableItems.forEach((item) => {
      if (item.type === "row" && item.payloadKeys) {
        const { done, dateDone, notDone, comment } = item.payloadKeys;

        savePayload[done] = payload[done] || "";

        savePayload[dateDone] = payload[dateDone]
          ? moment(payload[dateDone]).format("YYYY-MM-DD")
          : "";

        savePayload[notDone] = payload[notDone] || "";
        savePayload[comment] = payload[comment] || "";
      }
    });
    const res = await save_WardApi(savePayload);

    if (res?.success) {
      notify(res.message, "success");
      fetchWardData();
    }
  };
  let srNo = 1;
  const TBODY = tableItems.map((item) => {
    if (item.type === "section") {
      return {
        "Sr.No": "",
        ITEMS: <b>{item.label}</b>,
        "DONE / DATE": "",
        "NOT DONE": "",
        "ACTION / COMMENTS": "",
      };
    }

    const { done, dateDone, notDone, comment } = item.payloadKeys;

    return {
      "Sr.No": srNo++,
      ITEMS: item.label,
      "DATE DONE": (
        <div className="row">
          <Input
            type="text"
            className="form-control"
            respclass={"col-xl-6 col-lg-6 col-md-6 col-6"}
            name={done}
            value={payload[done]}
            onChange={handleChange}
          />
          <DatePicker
            className="custom-calender"
            respclass={"col-xl-6 col-lg-6 col-md-6 col-6"}
            placeholder={VITE_DATE_FORMAT}
            name={dateDone}
            value={payload[dateDone]}
            handleChange={handleChange}
          />
        </div>
      ),
      "NOT DONE": (
        <Input
          type="text"
          name={notDone}
          className="form-control"
          value={payload[notDone]}
          onChange={handleChange}
        />
      ),
      "ACTION / COMMENTS": (
        <Input
          type="text"
          className="form-control"
          name={comment}
          value={payload[comment]}
          onChange={handleChange}
        />
      ),
    };
  });

  return (
    <>
      <div className="patient_registration card mt-2">
        <Tables thead={THEAD} tbody={TBODY} tableHeight={"tableHeight"}/>
      </div>

      <div className="d-flex justify-content-end mb-2 mt-2">
        <button type="button" className="btn btn-primary" onClick={handleSave}>
          {isRecordExist ? t("Update") : t("Save")}
        </button>
      </div>
    </>
  );
};

export default WardChecklist;
