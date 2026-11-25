import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Tables from "../UI/customTable";
import Input from "../formComponent/Input";
import DatePicker from "../formComponent/DatePicker";
import {
  bindFollowUpDataApi,
  save_FollowApi,
} from "../../networkServices/nursingWardAPI";
import { notify } from "../../utils/utils";
import moment from "moment";

const DishargeFollowUp = ({ data }) => {
  const { transactionID, patientID } = data || {};
  const { t } = useTranslation();
  const { VITE_DATE_FORMAT } = import.meta.env;

  const tableItems = [
    {
      type: "row",
      label: (
        <span>
          {t("Book the patient an appointment to see a doctor.")} <br />
          {t("2wks or less depending on doctors instructions")}
        </span>
      ),
      payloadKeys: {
        done: "followUp_Done1",
        dateDone: "followUp_Date1",
        notDone: "followUp_NotDone1",
        comment: "followUp_Comment1",
      },
    },
    {
      type: "row",
      label: (
        <span>
          {t("Emphasize on exercise progression as recommended.")}
          <br />
          {t("Activity limitations(no lifting, no pushing or pulling of anything")}{" "}
          <br />
          {t("10lb for 6-8 wks; no driving for 6-8 wks) Recommended exercise progression after surgery")}
        </span>
      ),
      payloadKeys: {
        done: "followUp_Done2",
        dateDone: "followUp_Date2",
        notDone: "followUp_NotDone2",
        comment: "followUp_Comment2",
      },
    },
    {
      type: "row",
      label: <span>{t("Recommended diet after surgery")} </span>,
      payloadKeys: {
        done: "followUp_Done3",
        dateDone: "followUp_Date3",
        notDone: "followUp_NotDone3",
        comment: "followUp_Comment3",
      },
    },
    {
      type: "row",
      label: (
        <span>
          {t("Information regarding the prescribed medications.(including the pain medication)")}{" "}
        </span>
      ),
      payloadKeys: {
        done: "followUp_Done4",
        dateDone: "followUp_Date4",
        notDone: "followUp_NotDone4",
        comment: "followUp_Comment4",
      },
    },

    {
      type: "row",
      label: <span>{t("Anticipated mood changes")}</span>,
      payloadKeys: {
        done: "followUp_Done5",
        dateDone: "followUp_Date5",
        notDone: "followUp_NotDone5",
        comment: "followUp_Comment5",
      },
    },
    {
      type: "row",
      label: (
        <span>
          {t("Follow up appointment (2wks after surgery to see the")} <br />
          {t("surgeon/cardiologist then subsequent visits per doctors instructions)")}{" "}
        </span>
      ),
      payloadKeys: {
        done: "followUp_Done6",
        dateDone: "followUp_Date6",
        notDone: "followUp_NotDone6",
        comment: "followUp_Comment6",
      },
    },
    {
      type: "row",
      label: (
        <>
          <span className="fw-semibold">
            {t("Additional information for valve patients:")}{" "}
          </span>
          <ul className="mb-0 ps-3">
            <li>{t("Symptoms of Endocarditis")}</li>
            <li>{t("Antibiotic prophylaxis before invasive procedures")}</li>
            <li>
              {t("Anticoagulation information regarding therapy and follow up.")}
            </li>
            <li>{t("To take history and reassure the patient")}</li>
          </ul>
        </>
      ),
      payloadKeys: {
        done: "followUp_Done7",
        dateDone: "followUp_Date7",
        notDone: "followUp_NotDone7",
        comment: "followUp_Comment7",
      },
    },
    {
      type: "row",
      label: <span>{t("Discharge Nurse")}</span>,
    },
  ];

  const THEAD = [
    { name: t("Sr.No"), width: "5%" },
    { name: t("ITEMS"), width: "1%" },
    { name: t("DATE DONE"), width: "28%" },
    { name: t("NOT DONE"), width: "" },
    { name: t("ACTION / COMMENTS"), width: "" },
  ];

  const [payload, savePayload] = useState({
    followUp_Done1: "",
    followUp_Date1: "",
    followUp_NotDone1: "",
    followUp_Comment1: "",
    followUp_Done2: "",
    followUp_Date2: "",
    followUp_NotDone2: "",
    followUp_Comment2: "",
    followUp_Done3: "",
    followUp_Date3: "",
    followUp_NotDone3: "",
    followUp_Comment3: "",
    followUp_Done4: "",
    followUp_Date4: "",
    followUp_NotDone4: "",
    followUp_Comment4: "",
    followUp_Done5: "",
    followUp_Date5: "",
    followUp_NotDone5: "",
    followUp_Comment5: "",
    followUp_Done6: "",
    followUp_Date6: "",
    followUp_NotDone6: "",
    followUp_Comment6: "",
    followUp_Done7: "",
    followUp_Date7: "",
    followUp_NotDone7: "",
    followUp_Comment7: "",
    dischargenurse: "",
    pid: "",
    tid: "",
  });
  const [isRecordExist, setIsRecordExist] = useState(false);

  const parseApiDate = (dateStr) => {
    if (!dateStr) return null;
    return new Date(dateStr);
  };
  const handleChange = (name, value) => {
    savePayload((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const fetchList = async () => {
    const res = await bindFollowUpDataApi(transactionID, patientID);

    if (!res?.success) {
      setIsRecordExist(false);
      return;
    }

    const d = res.data?.[0] || {};

    savePayload({
      followUp_Done1: d.Item1_Done || "",
      followUp_Date1: d.Item1_Date ? new Date(d.Item1_Date) : null,
      followUp_NotDone1: d.Item1_NotDone || "",
      followUp_Comment1: d.Item1_Comment || "",

      followUp_Done2: d.Item2_Done || "",
      followUp_Date2: d.Item2_Date ? new Date(d.Item2_Date) : null,
      followUp_NotDone2: d.Item2_NotDone || "",
      followUp_Comment2: d.Item2_Comment || "",

      followUp_Done3: d.Item3_Done || "",
      followUp_Date3: d.Item3_Date ? new Date(d.Item3_Date) : null,
      followUp_NotDone3: d.Item3_NotDone || "",
      followUp_Comment3: d.Item3_Comment || "",

      followUp_Done4: d.Item4_Done || "",
      followUp_Date4: d.Item4_Date ? new Date(d.Item4_Date) : null,
      followUp_NotDone4: d.Item4_NotDone || "",
      followUp_Comment4: d.Item4_Comment || "",

      followUp_Done5: d.Item5_Done || "",
      followUp_Date5: d.Item5_Date ? new Date(d.Item5_Date) : null,
      followUp_NotDone5: d.Item5_NotDone || "",
      followUp_Comment5: d.Item5_Comment || "",

      followUp_Done6: d.Item6_Done || "",
      followUp_Date6: d.Item6_Date ? new Date(d.Item6_Date) : null,
      followUp_NotDone6: d.Item6_NotDone || "",
      followUp_Comment6: d.Item6_Comment || "",

      followUp_Done7: d.Item7_Done || "",
      followUp_Date7: d.Item7_Date ? new Date(d.Item7_Date) : null,
      followUp_NotDone7: d.Item7_NotDone || "",
      followUp_Comment7: d.Item7_Comment || "",

      dischargenurse: d.DischargeNurse || "",
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
      dischargenurse: payload.dischargenurse,
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

    const res = await save_FollowApi(savePayload);

    if (res?.success) {
      notify(res.message, "success");
      fetchList();
    }
  };
  let srNo = 1;

  const TBODY = tableItems.map((item) => {
    if (!item?.payloadKeys) {
      return {
        "Sr.No": srNo++,
        ITEMS: item.label,
        "DATE DONE": (
          <Input
            type="text"
            className="form-control"
            value={payload.dischargenurse}
            onChange={(e) => handleChange("dischargenurse", e.target.value)}
          />
        ),
        "NOT DONE": "",
        "ACTION / COMMENTS": "",
      };
    }

    const done = item.payloadKeys.done;
    const dateDone = item.payloadKeys.dateDone;
    const notDone = item.payloadKeys.notDone;
    const comment = item.payloadKeys.comment;

    return {
      "Sr.No": srNo++,
      ITEMS: item.label,

      "DATE DONE": (
        <div className="row">
          <Input
            type="text"
            className="form-control"
            respclass={"col-xl-6 col-lg-6 col-md-6 col-6"}
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
        <Tables thead={THEAD} tbody={TBODY} />
      </div>

      <div className="d-flex justify-content-end mt-2">
        <button type="button" className="btn btn-primary" onClick={handleSave}>
          {isRecordExist ? t("Update") : t("Save")}
        </button>
      </div>
    </>
  );
};

export default DishargeFollowUp;
