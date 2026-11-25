import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Tables from "../UI/customTable";
import Input from "../formComponent/Input";
import DatePicker from "../formComponent/DatePicker";
import {
  bindPhysiotherapyDataApi,
  save_PhysiotherapyApi,
} from "../../networkServices/nursingWardAPI";
import { notify } from "../../utils/utils";
import moment from "moment";

const PhysiotherapyCheckList = ({ data }) => {
  const { transactionID, patientID } = data || {};
  const { t } = useTranslation();
  const { VITE_DATE_FORMAT } = import.meta.env;

  const tableItems = [
    {
      type: "row",
      label: (
        <>
          <span className="fw-semibold">{t("Chest physiotherapy is done")} </span>
        </>
      ),
      payloadKeys: {
        done: "physiotherapY_Done1",
        dateDone: "labDate_Done23",
        notDone: "physiotherapY_NotDone1",
        comment: "physiotherapY_Comment1",
      },
    },
    {
      type: "row",
      label: (
        <>
          <span className="fw-semibold">
            {t("Patient is taught deep breathing exercises")}
          </span>
        </>
      ),
      payloadKeys: {
        done: "physiotherapY_Done2",
        dateDone: "labDate_Done24",
        notDone: "physiotherapY_NotDone2",
        comment: "physiotherapY_Comment2",
      },
    },

    { type: "section", label: t("Intra Operative") },

    {
      type: "row",
      label: t("No active role of the physiotherapist"),
      payloadKeys: {
        done: "physiotherapY_intDone1",
        dateDone: "labDate_Done25",
        notDone: "physiotherapY_intNotDone1",
        comment: "physiotherapY_intComment1",
      },
    },
    { type: "section", label: t("Post Operative") },

    {
      type: "row",
      label:
        t("Extensive and regular chest physiotherapy and suctioninal suctioning if required)"),
      payloadKeys: {
        done: "physiotherapY_postDone1",
        dateDone: "labDate_Done26",
        notDone: "physiotherapY_postNotDone1",
        comment: "physiotherapY_postComment1",
      },
    },

    {
      type: "row",
      label: t("Deep breathing exercises with tri flow device"),
      payloadKeys: {
        done: "physiotherapY_postDone2",
        dateDone: "labDate_Done27",
        notDone: "physiotherapY_postNotDone2",
        comment: "physiotherapY_postComment2",
      },
    },
    {
      type: "row",
      label: t("Passive and active limb exercises"),
      payloadKeys: {
        done: "physiotherapY_postDone3",
        dateDone: "labDate_Done28",
        notDone: "physiotherapY_postNotDone3",
        comment: "physiotherapY_postComment3",
      },
    },
    {
      type: "row",
      label: t("Early sitting out of bed and early ambulation"),
      payloadKeys: {
        done: "physiotherapY_postDone4",
        dateDone: "labDate_Done29",
        notDone: "physiotherapY_postNotDone4",
        comment: "physiotherapY_postNotDone4",
      },
    },
  ];

  const THEAD = [
    { name: t("Sr.No"), width: "5%" },
    { name: t("ITEMS"), width: "1%" },
    { name: t("DATE DONE"), width: "28%" },
    { name: t("NOT DONE"), width: "" },
    { name: t("ACTION / COMMENTS"), width: "" },
  ];

  const [payload, setPayload] = useState({
    physiotherapY_Done1: "",
    labDate_Done23: "",
    physiotherapY_NotDone1: "",
    physiotherapY_Comment1: "",

    physiotherapY_Done2: "",
    labDate_Done24: "",
    physiotherapY_NotDone2: "",
    physiotherapY_Comment2: "",

    physiotherapY_intDone1: "",
    labDate_Done25: "",
    physiotherapY_intNotDone1: "",
    physiotherapY_intComment1: "",

    physiotherapY_postDone1: "",
    labDate_Done26: "",
    physiotherapY_postNotDone1: "",
    physiotherapY_postComment1: "",

    physiotherapY_postDone2: "",
    labDate_Done27: "",
    physiotherapY_postNotDone2: "",
    physiotherapY_postComment2: "",

    physiotherapY_postDone3: "",
    labDate_Done28: "",
    physiotherapY_postNotDone3: "",
    physiotherapY_postComment3: "",

    pid: patientID || "",
    tid: transactionID || "",
  });

  const [isRecordExist, setIsRecordExist] = useState(false);

  const parseApiDate = (dateStr) => {
    if (!dateStr) return null;

    const [datePart, timePart] = dateStr.split("T");
    const [year, month, day] = datePart.split("-").map(Number);
    const [hour = 0, minute = 0, second = 0] = (timePart || "")
      .split(":")
      .map(Number);

    return new Date(year, month - 1, day, hour, minute, second);
  };
  const handleChange = (e) => {
    const { name, value } = e.target;
    setPayload((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const mapApiToPayload = (r) => ({
    physiotherapY_Done1: r.Item1_Done ?? "",
    labDate_Done23: parseApiDate(r.Item1_Date),
    physiotherapY_NotDone1: r.Item1_NotDone ?? "",
    physiotherapY_Comment1: r.Item1_Comment ?? "",

    physiotherapY_Done2: r.Item2_Done ?? "",
    labDate_Done24: parseApiDate(r.Item2_Date),

    physiotherapY_intDone1: r.Item3_Done ?? "",
    labDate_Done25: parseApiDate(r.Item3_Date),

    physiotherapY_postDone1: r.Item4_Done ?? "",
    labDate_Done26: parseApiDate(r.Item4_Date),

    physiotherapY_postDone2: r.Item5_Done ?? "",
    labDate_Done27: parseApiDate(r.Item5_Date),

    physiotherapY_postDone3: r.Item6_Done ?? "",
    labDate_Done28: parseApiDate(r.Item6_Date),

    physiotherapY_postDone4: r.Item7_Done ?? "",
    labDate_Done29: parseApiDate(r.Item7_Date),

    pid: patientID,
    tid: transactionID,
  });

  const fetchPhysioData = async () => {
    const res = await bindPhysiotherapyDataApi(transactionID, patientID);
    if (res?.success) {
      setIsRecordExist(true);
      setPayload(mapApiToPayload(res.data[0]));
    }
  };

  useEffect(() => {
    fetchPhysioData();
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
    debugger;
    const res = await save_PhysiotherapyApi(savePayload);

    if (res?.success) {
      notify(res.message, "success");
      fetchPhysioData();
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
      "DONE / DATE": (
        <div className="row">
          <Input
            type="text"
            respclass={"col-xl-6 col-lg-6 col-md-6 col-6"}
            className="form-control"
            name={done}
            value={payload[done]}
            onChange={handleChange}
          />
          <DatePicker
            className="custom-calender"
            placeholder={VITE_DATE_FORMAT}
            name={dateDone}
            respclass={"col-xl-6 col-lg-6 col-md-6 col-6"}
            value={payload[dateDone]}
            handleChange={handleChange}
          />
        </div>
      ),
      "NOT DONE": (
        <Input
          type="text"
          className="form-control"
          value={payload[notDone]}
          onChange={handleChange}
        />
      ),
      "ACTION / COMMENTS": (
        <Input
          type="text"
          className="form-control"
          value={payload[comment]}
          onChange={handleChange}
        />
      ),
    };
  });

  return (
    <>
      <div className="patient_registration card mt-2">
        <Tables thead={THEAD} tbody={TBODY} />
      </div>

      <div className="d-flex justify-content-end mb-2 mt-2">
        <button type="button" className="btn btn-primary" onClick={handleSave}>
          {isRecordExist ? t("Update") : t("Save")}
        </button>
      </div>
    </>
  );
};

export default PhysiotherapyCheckList;
