import { useTranslation } from "react-i18next";
import {
  bindDetails_Ovulation_InductionApi,
  print_Ovulation_InductionApi,
  PrintblankPrint_Previous_Infertility,
  save_Ovulation_InductionApi,
} from "../../../networkServices/IVFApi";
import { useEffect, useState } from "react";
import moment from "moment/moment";
import { notify } from "../../../utils/utils";
import Input from "../../formComponent/Input";
import DatePicker from "../../formComponent/DatePicker";
import TimePicker from "../../formComponent/TimePicker";
import Tables from "../../UI/customTable";
import { RedirectURL } from "../../../networkServices/PDFURL";
import Heading from "../../UI/Heading";

const IVFOvulationInduction = (data) => {
  const [t] = useTranslation();
  const { TransactionID: transactionID, PatientID: patientID } =
    data?.patientDetail || {};
  const { VITE_DATE_FORMAT } = import.meta.env;

  const THEAD = [
    { name: t("SNo") },
    { name: t("Date") },
    { name: t("GnRH mg.Agonist S/C Antagonist S/C") },
    { name: t("HMG I.U.I.M") },
    { name: t("R-FSH") },
    { name: t("LH") },
    { name: t("E2 pg/ml") },
    { name: t("P4 ng/ml") },
    { name: t("Right Ovary") },
    { name: t("Left Ovary") },
    { name: t("Endo.T.mm") },
    { name: t("Edit") },
    { name: t("Print") },
  ];

  const [payload, setPayload] = useState({
    transactionID: "",
    patientID: "",
    diagnosis: "",
    procedureName: "",
    lmp: "",
    date: new Date(),
    gnRH: "",
    hmg: "",
    rfsh: "",
    lh: "",
    e2: "",
    p4: "",
    rightOvary: "",
    leftOvary: "",
    endo: "",
    triggerINJ: "",
    dose: "",
    route: "",
    date1: new Date(),
    time1: "",
    homeClinic: "",
    opuDate: new Date(),
    opuTime: "",
    id: "",
  });
  const [isEdit, setIsEdit] = useState(false);
  const [tableData, setTableData] = useState([]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPayload((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  const fetchData = async () => {
    try {
      const response = await bindDetails_Ovulation_InductionApi(transactionID);

      if (response?.success) {
        setTableData(response?.data || []);
      } else {
        notify(response?.message, "error");
      }
    } catch (error) {
      notify(error?.response?.data?.message, "error");
      console.error(error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);
  const hanldleprint = async () => {
    try {
      const response = await PrintblankPrint_Previous_Infertility(1);

      if (response?.success) {
        RedirectURL(response?.data?.pdfUrl);
      }
    } catch (error) {
      notify(error?.message || "Print error", "error");
    }
  };
  const handleRowPrint = async (item) => {
    try {
      const response = await print_Ovulation_InductionApi(
        transactionID,
        item?.ID,
      );
      if (response?.success) {
        RedirectURL(response?.data?.pdfUrl);
      }
    } catch (error) {
      notify(error?.message || "Print error", "error");
    }
  };
  const handleSave = async () => {
    const finalPayload = {
      id: payload.id || "0",
      patientID,
      transactionID,
      diagnosis: payload?.diagnosis || "",
      procedureName: payload?.procedureName || "",
      lmp: payload?.lmp || "",
      date: payload?.date ? moment(payload.date).format("YYYY-MM-DD") : "",
      gnRH: payload?.gnRH || "",
      hmg: payload?.hmg || "",
      rfsh: payload?.rfsh || "",
      lh: payload?.lh || "",
      e2: payload?.e2 || "",
      p4: payload?.p4 || "",
      rightOvary: payload?.rightOvary || "",
      leftOvary: payload?.leftOvary || "",
      endo: payload?.endo || "",
      triggerINJ: payload?.triggerINJ || "",
      dose: payload?.dose || "",
      route: payload?.route || "",
      date1: payload?.date1 ? moment(payload?.date1).format("YYYY-MM-DD") : "",
      time1: payload?.time1 ? moment(payload.time1).format("hh:mm A") : "",
      homeClinic: payload?.homeClinic || "",
      opuDate: payload?.opuDate
        ? moment(payload?.opuDate).format("YYYY-MM-DD")
        : "",
      opuTime: payload?.opuTime
        ? moment(payload?.opuTime).format("hh:mm A")
        : "",
    };
    try {
      const response = await save_Ovulation_InductionApi(finalPayload);
      if (response?.success) {
        notify(response?.message, "success");
        fetchData();
        resetForm();
        setIsEdit();
      } else {
        notify(response?.message || "Save failed", "error");
      }
    } catch (error) {
      notify(response?.message, "error");
      console.error(error);
    }
  };
  const resetForm = () => {
    setPayload({
      transactionID: "",
      patientID: "",
      diagnosis: "",
      procedureName: "",
      lmp: "",
      date: new Date(),
      gnRH: "",
      hmg: "",
      rfsh: "",
      lh: "",
      e2: "",
      p4: "",
      rightOvary: "",
      leftOvary: "",
      endo: "",
      triggerINJ: "",
      dose: "",
      route: "",
      date1: "",
      time1: "",
      homeClinic: "",
      opuDate: "",
      opuTime: "",
      id: "",
    });
  };

  const handleEdit = (item) => {
    setPayload({
      id: item?.ID || 0,
      patientID,
      transactionID,

      diagnosis: item?.Diagnosis || "",
      procedureName: item?.ProcedureName || "",
      lmp: item?.LMP || "",

      date: item?.DATE ? moment(item.DATE, "DD-MMM-YYYY").toDate() : "",

      gnRH: item?.GnRH || "",
      hmg: item?.HMG || "",
      rfsh: item?.RFSH || "",
      lh: item?.LH || "",
      e2: item?.E2 || "",
      p4: item?.P4 || "",

      rightOvary: item?.RightOvary || "",
      leftOvary: item?.LeftOvary || "",
      endo: item?.Endo || "",

      triggerINJ: item?.TriggerINJ || "",
      dose: item?.Dose || "",
      route: item?.Route || "",

      date1: item?.Date1 ? moment(item.Date1, "DD-MMM-YYYY").toDate() : "",

      time1: item?.Time1 ? moment(item.Time1, "HH:mm:ss").toDate() : "",

      homeClinic: item?.HomeClinic || "",

      opuDate: item?.OPUDate
        ? moment(item.OPUDate, "DD-MMM-YYYY").toDate()
        : "",

      opuTime: item?.OPUTime ? moment(item.OPUTime, "HH:mm:ss").toDate() : "",
    });

    setIsEdit(true);
  };

  return (
    <>
      <div className="m-2 spatient_registration_card">
        <div className="patient_registration card">
          <Heading title={t("Entry details")} isBreadcrumb={false} />
          <div className="row p-2">
            <Input
              type="text"
              className="form-control"
              placeholder=""
              lable={t("Diagnosis")}
              id="diagnosis"
              name="diagnosis"
              value={payload?.diagnosis}
              onChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
            <Input
              type="text"
              className="form-control"
              placeholder=""
              lable={t("Procedure Name")}
              id="procedureName"
              name="procedureName"
              value={payload?.procedureName}
              onChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
            <Input
              type="text"
              className="form-control"
              placeholder=""
              lable={t("LMP")}
              id="lmp"
              name="lmp"
              value={payload?.lmp}
              onChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
            <DatePicker
              placeholder={VITE_DATE_FORMAT}
              className="custom-calendar"
              lable={t("Date")}
              name="date"
              id="date"
              value={payload?.date}
              showTime
              hourFormat="12"
              handleChange={handleChange}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            />
            <Input
              type="text"
              className="form-control"
              placeholder=""
              lable={t("GnRH mg.Agonist S/C Antagonist S/C")}
              id="gnRH"
              name="gnRH"
              value={payload?.gnRH}
              onChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
            <Input
              type="text"
              className="form-control"
              placeholder=""
              lable={t("HMG I.U.I.M")}
              id="hmg"
              name="hmg"
              value={payload?.hmg}
              onChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
            <Input
              type="text"
              className="form-control"
              placeholder=""
              lable={t("R-FSH I.U.S/C")}
              id="rfsh"
              name="rfsh"
              value={payload?.rfsh}
              onChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
            <Input
              type="text"
              className="form-control"
              placeholder=""
              lable={t("LH")}
              id="lh"
              name="lh"
              value={payload?.lh}
              onChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
            <Input
              type="text"
              className="form-control"
              placeholder=""
              lable={t("E2 pg/ml")}
              id="e2"
              name="e2"
              value={payload?.e2}
              onChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
            <Input
              type="text"
              className="form-control"
              placeholder=""
              lable={t("P4 ng/ml")}
              id="p4"
              name="p4"
              value={payload?.p4}
              onChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
            <Input
              type="text"
              className="form-control"
              placeholder=""
              lable={t("Right Ovary")}
              id="rightOvary"
              name="rightOvary"
              value={payload?.rightOvary}
              onChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
            <Input
              type="text"
              className="form-control"
              placeholder=""
              lable={t("Left Ovary")}
              id="leftOvary"
              name="leftOvary"
              value={payload?.leftOvary}
              onChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
            <Input
              type="text"
              className="form-control"
              placeholder=""
              lable={t("Endo.T.mm")}
              id="endo"
              name="endo"
              value={payload?.endo}
              onChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
            <Input
              type="text"
              className="form-control"
              placeholder=""
              lable={t("Trigger-INJ")}
              id="triggerINJ"
              name="triggerINJ"
              value={payload?.triggerINJ}
              onChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
            <Input
              type="text"
              className="form-control"
              placeholder=""
              lable={t("Dose")}
              id="dose"
              name="dose"
              value={payload?.dose}
              onChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
            <Input
              type="text"
              className="form-control"
              placeholder=""
              lable={t("Route S/C I/M")}
              id="route"
              name="route"
              value={payload?.route}
              onChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
            <DatePicker
              placeholder={VITE_DATE_FORMAT}
              className="custom-calendar"
              lable={t("Date")}
              name="date1"
              id="date1"
              value={payload?.date1}
              showTime
              hourFormat="12"
              handleChange={handleChange}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            />
            <TimePicker
              placeholderName={t("Time")}
              lable={t("Time")}
              id="time1"
              name="time1"
              value={payload?.time1}
              handleChange={handleChange}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            />
            <Input
              type="text"
              className="form-control"
              placeholder=""
              lable={t("Route S/C I/M")}
              id="homeClinic"
              name="homeClinic"
              value={payload?.homeClinic}
              onChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
            <DatePicker
              placeholder={VITE_DATE_FORMAT}
              className="custom-calendar"
              lable={t("OPU Date")}
              name="opuDate"
              id="opuDate"
              value={payload?.opuDate}
              showTime
              hourFormat="12"
              handleChange={handleChange}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            />
            <TimePicker
              placeholderName={t("OPU Time")}
              lable={t("OPU Time")}
              name="opuTime"
              id="opuTime"
              handleChange={handleChange}
              value={payload?.opuTime}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            />
          </div>
          <div className="d-flex justify-content-end gap-2 mt-3 mb-3 p-2">
            <button
              type="button"
              className="btn btn-primary mr-2"
              onClick={handleSave}
            >
              {isEdit ? t("Update") : t("Save")}
            </button>

            <button
              type="button"
              className="btn btn-success"
              onClick={hanldleprint}
            >
              {t("Print Blank")}
            </button>
          </div>
        </div>
      </div>
      {tableData && tableData.length > 0 && (
        <>
          <div className="patient_registration card mt-2"></div>
          <Heading title={t("History Details")} />
          <Tables
            thead={THEAD}
            tbody={tableData?.map((item, index) => ({
              SNo: index + 1,
              Date: item?.DATE,
              "GnRH mg.Agonist S/C Antagonist S/C": item?.GnRH,
              "HMG I.U.I.M": item?.HMG,
              "R-FSH": item?.RFSH,
              LH: item?.LH,
              "E2 pg/ml": item?.E2 || "",
              "P4 ng/ml": item?.P4 || "",
              "Right Ovary": item?.RightOvary || "",
              "Left Ovary": item?.LeftOvary || "",
              "Endo.T.mm": item?.Endo || "",
              Edit: (
                <i
                  className="fa fa-edit p-1"
                  onClick={() => handleEdit(item)}
                  style={{ cursor: "pointer", color: "blue" }}
                  title={t("Edit")}
                />
              ),
              Print: (
                <i
                  className="fa fa-print p-1"
                  onClick={() => handleRowPrint(item)}
                  style={{ cursor: "pointer", color: "green" }}
                  title={t("Print")}
                />
              ),
            }))}
          />
        </>
      )}
    </>
  );
};
export default IVFOvulationInduction;
