import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocalStorage } from "../../utils/hooks/useLocalStorage";
import Input from "../formComponent/Input";
import DatePicker from "../formComponent/DatePicker";
import Heading from "../UI/Heading";
import Tables from "../UI/customTable";
import { tab } from "@testing-library/user-event/dist/cjs/convenience/tab.js";
import TextAreaInput from "../formComponent/TextAreaInput";
import Accordion from "../UI/Accordion";
import {
  getObstetricRecordFormsApi,
  saveOrUpdateObstetricRecordFormsApi,
} from "../../networkServices/nursingWardAPI";
import { notify } from "../../utils/utils";
import TimePicker from "../formComponent/TimePicker";

const drugsEmptyRow = {
  Date: new Date(),
  Time: "",
  Drug: "",
  Dose: "",
  GivenBy: "",
  Remarks: "",
};

const perineumEmptyRow = {
  Perineum: "",
  Sutures: "",
  ByWhom: "",
};

const ReportOnLabour = ({ data, section }) => {
  const { t } = useTranslation();
  const ip = useLocalStorage("ip", "get");
  const { VITE_DATE_FORMAT } = import.meta.env;
  const { transactionID } = data;

  const [initialState, setInitialState] = useState({
    reportOnLabour: {
      records: {
        id: 0,
        patientId: "",
        transactionId: "",
        txtDate: new Date(),
        txtReportOnLabour: "",
        txt1stage: "",
        txtDilvered: "",
        txt2stage: "",
        txtDoctor: "",
        txt3stage: "",
        txtmidwife: "",
        txttotalstage: "",
        txtstudent: "",
        txtconditionofmother: "",
        txtconditionofbaby: "",
        txttpr: "",
        txtsex: "",
        txtfundus: "",
        txtweight: "",
        txtlosspv: "",
        txtabnormalities: "",
        txtbp: "",
        txtremarks: "",
        txtweightofplacenta: "",
        txtBirthNotification: "",
        dateofnotification: new Date(),
        txtNotified: "",
      },

      details: [
        {
          patientId: "",
          transactionId: "",
          date1: "",
          date2: "",
          date3: "",
          date4: "",
          date5: "",
          date6: "",
          hours: "",
          hours1: "",
          hours2: "",
          hours3: "",
          hours4: "",
          hours5: "",
        },
      ],

      details1: [
        {
          patientId: "",
          transactionId: "",
          tdDate: "",
          tdTime: "",
          tdDrug: "",
          tdDose: "",
          tdGivenBy: "",
          tdRemarks: "",
        },
      ],

      details2: [
        {
          patientId: "",
          transactionId: "",
          tdPerineum: "",
          tdSufures: "",
          tdWhom: "",
        },
      ],
    },
  });

  const [labourTable, setLabourTable] = useState({
    date: {
      began: new Date(),
      membranesRuptured: new Date(),
      fullDilated: new Date(),
      babyBorn: new Date(),
      placentaExpelled: new Date(),
      amountOfLoss: new Date(),
    },
    hours: {
      began: "",
      membranesRuptured: "",
      fullDilated: "",
      babyBorn: "",
      placentaExpelled: "",
      amountOfLoss: "",
    },
  });

  const handleLabourChange = (row, field, value) => {
    setLabourTable((prev) => ({
      ...prev,
      [row]: {
        ...prev[row],
        [field]: value,
      },
    }));
  };

  const formatDateForPicker = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr);
  };

  const tableData = [{ rowType: "Date" }, { rowType: "Hours" }];

  const [payload, setPayload] = useState(initialState);
  const [drugsTable, setDrugsTable] = useState([drugsEmptyRow]);
  const [perineumTable, setPerineumTable] = useState([perineumEmptyRow]);
  const [listData, setListData] = useState([]);
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState(null);

  const [responseCache, setResponseCache] = useState({
    stageDetails: [],
    drugDetails: [],
    procedureDetails: [],
  });

  const handleTableChange = (setter, index, field, value) => {
    setter((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  };

  const handleAddRow = (setter, emptyRow) => {
    setter((prev) => [...prev, { ...emptyRow }]);
  };

  const handleDeleteRow = (setter, index) => {
    setter((prev) => prev.filter((_, i) => i !== index));
  };
  const parseDateForPicker = (date) => {
    if (!date) return "";
    return new Date(date);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setPayload((prev) => ({
      ...prev,
      reportOnLabour: {
        ...prev.reportOnLabour,
        records: {
          ...prev.reportOnLabour.records,
          [name]: value,
        },
      },
    }));
  };

  const DrugsHead = [
    { name: t("Date") },
    t("Time"),
    t("Drug"),
    t("Dose"),
    t("Given By"),
    t("Remarks"),
    t("Action"),
  ];

  const thead = [
    t("Labour"),
    t("Began"),
    t("Mambranes Ruptured"),
    t("Full Diluted"),
    t("Baby Born"),
    t("Placenta Expelled"),
    t("Amount Of Loss"),
  ];

  const PerineumThead = [
    { name: t("Perineum") },
    { name: t("Sufures") },
    { name: t("By Whom") },
    { name: t("Action"), width: "5%" },
  ];

  const Updatedthead = [
    { name: t("PatientId"), width: "30%" },
    { name: t("Entryby") },
    { name: t("EntryDate") },
    { name: t("Edit"), width: "4%" },
  ];
  const formatTime = (time) => {
    if (!time) return "";
    if (typeof time === "string") return time;
    const d = new Date(time);
    return d.toTimeString().slice(0, 8); // HH:mm:ss
  };

  const parseTimeForPicker = (time) => {
    if (!time) return null;
    const [hh, mm, ss] = time.split(":").map(Number);
    return new Date(1970, 0, 1, hh, mm, ss || 0);
  };

  const fetchList = async () => {
    try {
      const req = {
        TransactionId: transactionID,
        SectionType: section,
      };

      const response = await getObstetricRecordFormsApi(req);

      if (response?.success && response?.data?.reportOnLabour) {
        const rol = response.data.reportOnLabour;

        setListData(rol.master || []);

        setResponseCache({
          stageDetails: rol.stageDetails || [],
          drugDetails: rol.drugDetails || [],
          procedureDetails: rol.procedureDetails || [],
        });
      } else {
        setListData([]);
        notify(response?.message, "error");
      }
    } catch (error) {
      console.error("Fetch error:", error);
    }
  };

  const handleSaveOrUpdate = async () => {
    try {
      const reqBody = {
        sectionType: section,
        reportOnLabour: {
          records: {
            ...payload.reportOnLabour.records,
            id: isEdit ? editId : 0,
            patientId: data?.patientID || "",
            transactionId: data?.transactionID || "",
          },

          details: [
            {
              patientId: data?.patientID || "",
              transactionId: data?.transactionID || "",
              date1: labourTable.date.began,
              date2: labourTable.date.membranesRuptured,
              date3: labourTable.date.fullDilated,
              date4: labourTable.date.babyBorn,
              date5: labourTable.date.placentaExpelled,
              date6: labourTable.date.amountOfLoss,
              hours: labourTable.hours.began,
              hours1: labourTable.hours.membranesRuptured,
              hours2: labourTable.hours.fullDilated,
              hours3: labourTable.hours.babyBorn,
              hours4: labourTable.hours.placentaExpelled,
              hours5: labourTable.hours.amountOfLoss,
            },
          ],

          details1: drugsTable.map((d) => ({
            patientId: data?.patientID || "",
            transactionId: data?.transactionID || "",
            tdDate: d.Date,
            tdTime: formatTime(d.Time),
            tdDrug: d.Drug,
            tdDose: d.Dose,
            tdGivenBy: d.GivenBy,
            tdRemarks: d.Remarks,
          })),

          details2: perineumTable.map((p) => ({
            patientId: data?.patientID || "",
            transactionId: data?.transactionID || "",
            tdPerineum: p.Perineum,
            tdSufures: p.Sutures,
            tdWhom: p.ByWhom,
          })),
        },
      };

      const res = await saveOrUpdateObstetricRecordFormsApi(reqBody);

      if (res?.success) {
        notify(res?.message, "success");

        await fetchList();
        resetForm();
      }
    } catch (error) {
      console.error(error);
      notify(t("Server error"), "error");
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  const handleEdit = (item) => {
    setIsEdit(true);
    setEditId(item.id);

    setPayload({
      reportOnLabour: {
        records: {
          ...item,
          txtDate: parseDateForPicker(item.txtDate),
          dateofnotification: parseDateForPicker(item.dateofnotification),
        },
        details: [],
        details1: [],
        details2: [],
      },
    });

    const stage = responseCache.stageDetails?.find((d) => d.txtid === item.id);

    if (stage) {
      setLabourTable({
        date: {
          began: formatDateForPicker(stage.date1),
          membranesRuptured: formatDateForPicker(stage.date2),
          fullDilated: formatDateForPicker(stage.date3),
          babyBorn: formatDateForPicker(stage.date4),
          placentaExpelled: formatDateForPicker(stage.date5),
          amountOfLoss: formatDateForPicker(stage.date6),
        },
        hours: {
          began: stage.hours || "",
          membranesRuptured: stage.hours1 || "",
          fullDilated: stage.hours2 || "",
          babyBorn: stage.hours3 || "",
          placentaExpelled: stage.hours4 || "",
          amountOfLoss: stage.hours5 || "",
        },
      });
    }

    const drugsData =
      responseCache.drugDetails
        ?.filter(
          (d) =>
            d.patientId === item.patientId &&
            d.transactionId === item.transactionId
        )
        .map((d) => ({
          Date: d.tdDate ? new Date(d.tdDate) : "",
          Time: parseTimeForPicker(d.tdTime) || "",
          Drug: d.tdDrug || "",
          Dose: d.tdDose || "",
          GivenBy: d.tdGivenBy || "",
          Remarks: d.tdRemarks || "",
        })) || [];

    setDrugsTable(drugsData.length ? drugsData : [{ ...drugsEmptyRow }]);

    const perineumData =
      responseCache.procedureDetails
        ?.filter(
          (p) =>
            p.patientId === item.patientId &&
            p.transactionId === item.transactionId
        )
        .map((p) => ({
          Perineum: p.tdPerineum || "",
          Sutures: p.tdSufures || "",
          ByWhom: p.tdWhom || "",
        })) || [];

    setPerineumTable(
      perineumData.length ? perineumData : [{ ...perineumEmptyRow }]
    );
  };

  const resetForm = () => {
    setPayload(JSON.parse(JSON.stringify(initialState)));
    setLabourTable({
      date: {
        began: "",
        membranesRuptured: "",
        fullDilated: "",
        babyBorn: "",
        placentaExpelled: "",
        amountOfLoss: "",
      },
      hours: {
        began: "",
        membranesRuptured: "",
        fullDilated: "",
        babyBorn: "",
        placentaExpelled: "",
        amountOfLoss: "",
      },
    });
    setDrugsTable([drugsEmptyRow]);
    setPerineumTable([perineumEmptyRow]);
    setIsEdit(false);
    setEditId(null);
  };

  useEffect(() => {
    setPayload({
      ...payload,
    });
  }, [data]);
  return (
    <>
      <div className="px-2 mt-2">
        <Heading title={t("Antenatal Record")} />
      </div>
      <div className="row px-2 mt-2 mb-2">
        <TextAreaInput
          lable={t("Report On Labour(Status of Patient")}
          placeholder=""
          className="w-100"
          name="txtReportOnLabour"
          id="txtReportOnLabour"
          value={payload.reportOnLabour.records.txtReportOnLabour}
          maxLength={200}
          onChange={handleChange}
          respclass="col-xl-3 col-md-4 col-sm-6 col-12 mb-2"
        />
        <DatePicker
          className="custom-calendar"
          placeholder={VITE_DATE_FORMAT}
          lable={t("Date")}
          respclass={"col-xl-2 col-md-3 col-sm-4 col-12"}
          name="txtDate"
          id="txtDate"
          value={payload.reportOnLabour.records.txtDate}
          showTime
          hourFormat="12"
          handleChange={handleChange}
        />
      </div>
      <Tables
        thead={thead}
        tbody={[
          {
            Labour: <strong>{t("Date")}</strong>,
            Began: (
              <DatePicker
                value={labourTable.date.began}
                handleChange={(e) =>
                  handleLabourChange("date", "began", e.target.value)
                }
              />
            ),
            "Mambranes Ruptured": (
              <DatePicker
                value={labourTable.date.membranesRuptured}
                handleChange={(e) =>
                  handleLabourChange(
                    "date",
                    "membranesRuptured",
                    e.target.value
                  )
                }
              />
            ),
            "Full Diluted": (
              <DatePicker
                value={labourTable.date.fullDilated}
                handleChange={(e) =>
                  handleLabourChange("date", "fullDilated", e.target.value)
                }
              />
            ),
            "Baby Born": (
              <DatePicker
                value={labourTable.date.babyBorn}
                onChange={(e) =>
                  handleLabourChange("date", "babyBorn", e.target.value)
                }
              />
            ),
            "Placenta Expelled": (
              <DatePicker
                value={labourTable.date.placentaExpelled}
                handleChange={(e) =>
                  handleLabourChange("date", "placentaExpelled", e.target.value)
                }
              />
            ),
            "Amount Of Loss": (
              <DatePicker
                value={labourTable.date.amountOfLoss}
                handleChange={(e) =>
                  handleLabourChange("date", "amountOfLoss", e.target.value)
                }
              />
            ),
          },
          {
            Labour: <strong>{t("Hours")}</strong>,
            Began: (
              <input
                type="number"
                className="form-control"
                value={labourTable.hours.began}
                onChange={(e) =>
                  handleLabourChange("hours", "began", e.target.value)
                }
              />
            ),
            "Mambranes Ruptured": (
              <input
                type="number"
                className="form-control"
                value={labourTable.hours.membranesRuptured}
                onChange={(e) =>
                  handleLabourChange(
                    "hours",
                    "membranesRuptured",
                    e.target.value
                  )
                }
              />
            ),
            "Full Diluted": (
              <input
                type="number"
                className="form-control"
                value={labourTable.hours.fullDilated}
                onChange={(e) =>
                  handleLabourChange("hours", "fullDilated", e.target.value)
                }
              />
            ),
            "Baby Born": (
              <input
                type="number"
                className="form-control"
                value={labourTable.hours.babyBorn}
                onChange={(e) =>
                  handleLabourChange("hours", "babyBorn", e.target.value)
                }
              />
            ),
            "Placenta Expelled": (
              <input
                type="number"
                className="form-control"
                value={labourTable.hours.placentaExpelled}
                onChange={(e) =>
                  handleLabourChange(
                    "hours",
                    "placentaExpelled",
                    e.target.value
                  )
                }
              />
            ),
            "Amount Of Loss": (
              <input
                type="number"
                className="form-control"
                value={labourTable.hours.amountOfLoss}
                onChange={(e) =>
                  handleLabourChange("hours", "amountOfLoss", e.target.value)
                }
              />
            ),
          },
        ]}
      />

      <div className="pt-2">
        <Heading title={t("Drugs Ordered During LabourIncluding 3rd Stage")} />
      </div>

      <Tables
        thead={DrugsHead}
        tbody={drugsTable.map((row, index) => ({
          Date: (
            <DatePicker
              placeholder={VITE_DATE_FORMAT}
              className="custom-calender"
              value={row.Date}
              handleChange={(e) =>
                handleTableChange(setDrugsTable, index, "Date", e.target.value)
              }
            />
          ),
          Time: (
            <TimePicker
              placeholderName=""
              id="Time"
              name="Time"
              value={row?.Time}
              handleChange={(e) =>
                handleTableChange(setDrugsTable, index, "Time", e.target.value)
              }
            />
          ),

          Drug: (
            <input
              className="form-control"
              value={row.Drug}
              onChange={(e) =>
                handleTableChange(setDrugsTable, index, "Drug", e.target.value)
              }
            />
          ),
          Dose: (
            <input
              className="form-control"
              value={row.Dose}
              onChange={(e) =>
                handleTableChange(setDrugsTable, index, "Dose", e.target.value)
              }
            />
          ),
          "Given By": (
            <input
              className="form-control"
              value={row.GivenBy}
              onChange={(e) =>
                handleTableChange(
                  setDrugsTable,
                  index,
                  "GivenBy",
                  e.target.value
                )
              }
            />
          ),
          Remarks: (
            <input
              className="form-control"
              value={row.Remarks}
              onChange={(e) =>
                handleTableChange(
                  setDrugsTable,
                  index,
                  "Remarks",
                  e.target.value
                )
              }
            />
          ),
          Action: (
            <div className="d-flex gap-2">
              <button
                className="btn btn-sm btn-success"
                onClick={() => handleAddRow(setDrugsTable, drugsEmptyRow)}
              >
                +
              </button>
              <button
                className="btn btn-sm btn-danger ml-2"
                onClick={() => handleDeleteRow(setDrugsTable, index)}
              >
                -
              </button>
            </div>
          ),
        }))}
      />

      <Tables
        thead={PerineumThead}
        tbody={perineumTable.map((row, index) => ({
          Perineum: (
            <input
              className="form-control"
              value={row.Perineum}
              onChange={(e) =>
                handleTableChange(
                  setPerineumTable,
                  index,
                  "Perineum",
                  e.target.value
                )
              }
            />
          ),
          Sufures: (
            <input
              className="form-control"
              value={row.Sutures}
              onChange={(e) =>
                handleTableChange(
                  setPerineumTable,
                  index,
                  "Sutures",
                  e.target.value
                )
              }
            />
          ),
          ByWhom: (
            <input
              className="form-control"
              value={row.ByWhom}
              onChange={(e) =>
                handleTableChange(
                  setPerineumTable,
                  index,
                  "ByWhom",
                  e.target.value
                )
              }
            />
          ),

          Action: (
            <div className="d-flex gap-2">
              <button
                className="btn btn-sm btn-success"
                onClick={() => handleAddRow(setPerineumTable, perineumEmptyRow)}
              >
                +
              </button>
              <button
                className="btn btn-sm btn-danger ml-2"
                onClick={() => handleDeleteRow(setPerineumTable, index)}
              >
                -
              </button>
            </div>
          ),
        }))}
      />

      <div className="col-12 col-md-12 col-lg-12 mt-3 mb-2 p-0">
        <div
          className="pt-3 pb-2 pr-2 pl-2 form-group"
          style={{
            border: "1px solid #ced4da",
            borderRadius: "4px",
            position: "relative",
          }}
        >
          <label className="label" style={{ position: "absolute" }}>
            {t("Duration Of Labour")}
          </label>
          <div className="row">
            <div className="col-xl-2 col-md-4 col-sm-6 col-12">
              <Input
                type="text"
                className="form-control"
                lable={t("1st Stage")}
                name="txt1stage"
                id="txt1stage"
                placeholder=""
                value={payload.reportOnLabour.records.txt1stage}
                onChange={handleChange}
                respclass="row-12"
              />
            </div>

            <div className="col-xl-2 col-md-4 col-sm-6 col-12 mb-2">
              <Input
                type="text"
                lable={t("2ndStage")}
                className="form-control"
                name="txt2stage"
                id="txt2stage"
                placeholder=""
                value={payload.reportOnLabour.records.txt2stage}
                onChange={handleChange}
                respclass="row-12"
              />
            </div>

            <div className="col-xl-2 col-md-4 col-sm-6 col-12 mb-2">
              <Input
                type="text"
                lable={t("3rd Stage")}
                className="form-control"
                placeholder=""
                onChange={handleChange}
                value={payload.reportOnLabour.records.txt3stage}
                name="txt3stage"
                id="txt3stage"
                respclass="row-12"
              />
            </div>
            <div className="col-xl-2 col-md-4 col-sm-6 col-12 mb-2">
              <Input
                type="text"
                lable={t("Total Stage")}
                className="form-control"
                placeholder=""
                onChange={handleChange}
                value={payload.reportOnLabour.records.txttotalstage}
                name="txttotalstage"
                id="txttotalstage"
                respclass="row-12"
              />
            </div>
          </div>
        </div>
      </div>
      <div className="col-12 col-md-12 col-lg-12 mt-3 mb-2 p-0">
        <div
          className="pt-3 pb-2 pr-2 pl-2 form-group"
          style={{
            border: "1px solid #ced4da",
            borderRadius: "4px",
            position: "relative",
          }}
        >
          <label className="label" style={{ position: "absolute" }}>
            {t("Type Of Delivery")}
          </label>
          <div className="row">
            <div className="col-xl-2 col-md-4 col-sm-6 col-12 mb-2">
              <Input
                type="text"
                lable={t("Dilvered by")}
                className="form-control"
                name="txtDilvered"
                id="txtDilvered"
                placeholder=""
                value={payload.reportOnLabour.records.txtDilvered}
                onChange={handleChange}
                respclass="row-12"
              />
            </div>
            <div className="col-xl-2 col-md-4 col-sm-6 col-12 mb-2">
              <Input
                type="text"
                lable={t("Doctor")}
                className="form-control"
                value={payload.reportOnLabour.records.txtDoctor}
                name="txtDoctor"
                id="txtDoctor"
                placeholder=""
                onChange={handleChange}
                respclass="row-12"
              />
            </div>
            <div className="col-xl-2 col-md-4 col-sm-6 col-12 mb-2">
              <Input
                type="text"
                lable={t("Midwife")}
                className="form-control"
                placeholder=""
                onChange={handleChange}
                value={payload.reportOnLabour.records.txtmidwife}
                name="txtmidwife"
                id="txtmidwife"
                respclass="row-12"
              />
            </div>{" "}
            <div className="col-xl-2 col-md-4 col-sm-6 col-12 mb-2">
              <Input
                type="text"
                lable={t("Student Nurse")}
                className="form-control"
                placeholder=""
                onChange={handleChange}
                value={payload.reportOnLabour.records.txtstudent}
                name="txtstudent"
                id="txtstudent"
                respclass="row-12"
              />
            </div>
          </div>
        </div>
      </div>
      <div className="col-12 col-md-12 col-lg-12 mt-3 mb-2 p-0">
        <div
          className="pt-3 pb-2 pr-2 pl-2 form-group"
          style={{
            border: "1px solid #ced4da",
            borderRadius: "4px",
            position: "relative",
          }}
        >
          <label className="label" style={{ position: "absolute" }}>
            {t("AFTER DELVIERY")}
          </label>
          <div className="row">
            <div className="col-xl-2 col-md-4 col-sm-6 col-12">
              <Input
                type="text"
                className="form-control"
                lable={t("Condition Of Mother")}
                name="txtconditionofmother"
                id="txtconditionofmother"
                placeholder=""
                value={payload.reportOnLabour.records.txtconditionofmother}
                onChange={handleChange}
                respclass="row-12"
              />
            </div>
            <div className="col-xl-2 col-md-4 col-sm-6 col-12 mb-2">
              <Input
                type="text"
                lable={t("Condition Of Baby")}
                className="form-control"
                name="txtconditionofbaby"
                id="txtconditionofbaby"
                placeholder=""
                value={payload.reportOnLabour.records.txtconditionofbaby}
                onChange={handleChange}
                respclass="row-12"
              />
            </div>
            <div className="col-xl-2 col-md-4 col-sm-6 col-12 mb-2">
              <Input
                type="text"
                lable={t("T.P.R.")}
                className="form-control"
                name="txttpr"
                id="txttpr"
                placeholder=""
                value={payload.reportOnLabour.records.txttpr}
                onChange={handleChange}
                respclass="row-12"
              />
            </div>
            <div className="col-xl-2 col-md-4 col-sm-6 col-12 mb-2">
              <Input
                type="text"
                lable={t("Sex")}
                className="form-control"
                value={payload.reportOnLabour.records.txtsex}
                name="txtsex"
                id="txtsex"
                placeholder=""
                onChange={handleChange}
                respclass="row-12"
              />
            </div>
            <div className="col-xl-2 col-md-4 col-sm-6 col-12 mb-2">
              <Input
                type="text"
                lable={t("Fundus")}
                className="form-control"
                placeholder=""
                onChange={handleChange}
                value={payload.reportOnLabour.records.txtfundus}
                name="txtfundus"
                id="txtfundus"
                respclass="row-12"
              />
            </div>
            <div className="col-xl-2 col-md-4 col-sm-6 col-12 mb-2">
              <Input
                type="text"
                lable={t("Weight")}
                className="form-control"
                placeholder=""
                onChange={handleChange}
                value={payload.reportOnLabour.records.txtweight}
                name="txtweight"
                id="txtweight"
                respclass="row-12"
              />
            </div>
            <div className="col-xl-2 col-md-4 col-sm-6 col-12 mb-2">
              <Input
                type="text"
                lable={t("Loss P.v")}
                className="form-control"
                placeholder=""
                onChange={handleChange}
                value={payload.reportOnLabour.records.txtlosspv}
                name="txtlosspv"
                id="txtlosspv"
                respclass="row-12"
              />
            </div>
            <div className="col-xl-2 col-md-4 col-sm-6 col-12 mb-2">
              <Input
                type="text"
                lable={t("Abnormalities")}
                className="form-control"
                placeholder=""
                onChange={handleChange}
                value={payload.reportOnLabour.records.txtabnormalities}
                name="txtabnormalities"
                id="txtabnormalities"
                respclass="row-12"
              />
            </div>
            <div className="col-xl-2 col-md-4 col-sm-6 col-12 mb-2">
              <Input
                type="text"
                lable={t("BP")}
                className="form-control"
                placeholder=""
                onChange={handleChange}
                value={payload.reportOnLabour.records.txtbp}
                name="txtbp"
                id="txtbp"
                respclass="row-12"
              />
            </div>{" "}
            <div className="col-xl-2 col-md-4 col-sm-6 col-12 mb-2">
              <Input
                type="text"
                lable={t("Remarks")}
                className="form-control"
                placeholder=""
                onChange={handleChange}
                value={payload.reportOnLabour.records.txtremarks}
                name="txtremarks"
                id="txtremarks"
                respclass="row-12"
              />
            </div>
          </div>
        </div>
      </div>
      <div className="row px-2 mt-2">
        <TextAreaInput
          lable={t("Weight Of Placenta")}
          placeholder=""
          className="w-100"
          name="txtweightofplacenta"
          id="txtweightofplacenta"
          value={payload.reportOnLabour.records.txtweightofplacenta}
          maxLength={200}
          onChange={handleChange}
          respclass="col-xl-3 col-md-4 col-sm-6 col-12 mb-2"
        />
        <Input
          type="text"
          className="form-control"
          lable={t("Birth Notification No")}
          placeholder=""
          name="txtBirthNotification"
          id="txtBirthNotification"
          value={payload.reportOnLabour.records.txtBirthNotification}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12 mb-2"
          onChange={handleChange}
        />
        <DatePicker
          className="custom-calendar"
          placeholder={VITE_DATE_FORMAT}
          lable={t("Date Of Notification")}
          respclass={"col-xl-2 col-md-3 col-sm-4 col-12"}
          name="dateofnotification"
          id="dateofnotification"
          value={payload.reportOnLabour.records.dateofnotification}
          showTime
          hourFormat="12"
          handleChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          lable={t("Notified")}
          placeholder=""
          name="txtNotified"
          id="txtNotified"
          value={payload.reportOnLabour.records.txtNotified}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12 mb-2"
          onChange={handleChange}
        />
      </div>
      <div className="row">
        <div className="col-sm-12 d-flex justify-content-end mb-2">
          <button
            className="btn btn-sm btn-success"
            onClick={handleSaveOrUpdate}
          >
            {isEdit ? t("Update") : t("Save")}
          </button>
        </div>
      </div>
      <Tables
        thead={Updatedthead}
        tbody={listData?.map((item, index) => ({
          PatientId: item?.patientID || data?.patientID,
          Entryby: item?.entryBy || data?.entryBy,
          EntryDate: item?.entryDateTime || data?.entryDateTime,
          Edit: (
            <i
              className="fa fa-edit"
              style={{ cursor: "pointer", color: "blue" }}
              onClick={() => handleEdit(item)}
            />
          ),
        }))}
      />
    </>
  );
};

export default ReportOnLabour;
