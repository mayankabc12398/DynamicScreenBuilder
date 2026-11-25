import { useTranslation } from "react-i18next";
import {
  bindDetailsApi,
  blankPrint_ANCReport,
  printApi,
  saveANCRecordApi,
} from "../../networkServices/IVFApi";
import { RedirectURL } from "../../networkServices/PDFURL";
import { notify } from "../../utils/utils";
import DatePicker from "../formComponent/DatePicker";
import Input from "../formComponent/Input";
import ReactSelect from "../formComponent/ReactSelect";
import TextAreaInput from "../formComponent/TextAreaInput";
import Tables from "../UI/customTable";
import Heading from "../UI/Heading";
import { useEffect, useState } from "react";
import moment from "moment/moment";

const ANCRecord = (data) => {
  const { VITE_DATE_FORMAT } = import.meta.env;
  const [t] = useTranslation();
  const { transactionID, patientID } = data?.patientDetail ?? data?.data ?? {};
  console.log(transactionID, patientID, "aaaaa");
  const [payload, setPayload] = useState({
    ivfID: "",
    isPH: "",
    ph: "",
    isHypothyroidism: "",
    hypothyroidism: "",
    isDiab: "",
    isElderlyPrimi: "",
    elderlyPrimi: "",
    isMellit: "",
    mellit: "",
    isPreviousSurgery: "",
    previousSurgery: "",
    isGesta: "",
    gesta: "",
    isBOH: "",
    boh: "",
    lmp: new Date(),
    edd: new Date(),
    testName: "",
    highRiskFactors: "",
    id: "0",
  });

  const THEAD = [
    { name: t("SNo"), width: "1%" },
    { name: t("PH") },
    { name: t("Hypothyroidism") },
    { name: t("Elderly Primi") },
    { name: t("Mellit") },
    { name: t("Previous Surgery") },
    { name: t("Gesta") },
    { name: t("BOH") },
    { name: t("High Risk Factors") },
    { name: t("Edit"), width: "2%" },
    { name: t("Print"), width: "2%" },
  ];
  const [tableData, setTableData] = useState([]);
  const [isEdit, setIsEdit] = useState(false);

  const handleSave = async () => {
    const finalPayload = {
      // ...payload,
      // TransactionID: transactionID,
      // PatientID: patientID,
      // id: payload.id || "0",
      // isPH: payload.isPH || "0",
      // isHypothyroidism: payload.isHypothyroidism || "",
      // isDiab: payload.isDiab || "",
      // isElderlyPrimi: payload.isElderlyPrimi || "",
      // isMellit: payload.isMellit || "",
      // isPreviousSurgery: payload.isPreviousSurgery || "",
      // isGesta: payload.isGesta || "",
      // isBOH: payload.isBOH || "",
      // lmp: payload?.lmp ? moment(payload.lmp).format("YYYY-MM-DD") : "",
      // edd: payload?.edd ? moment(payload.edd).format("YYYY-MM-DD") : "",

      transactionID: transactionID ?? "",
      patientID: patientID ?? "",
      ivfID: payload?.ivfID ?? "",
      isPH: payload?.isPH ?? "",
      ph: payload?.ph ?? "",
      isHypothyroidism: payload?.isHypothyroidism ?? "",
      hypothyroidism: payload?.hypothyroidism ?? "",
      isDiab: payload?.isDiab ?? "",
      isElderlyPrimi: payload?.isElderlyPrimi ?? "",
      elderlyPrimi: payload?.elderlyPrimi ?? "",
      isMellit: payload?.isMellit ?? "",
      mellit: payload?.mellit ?? "",
      isPreviousSurgery: payload?.isPreviousSurgery ?? "",
      previousSurgery: payload?.previousSurgery ?? "",
      isGesta: payload?.isGesta ?? "",
      gesta: payload?.gesta ?? "",
      isBOH: payload?.isBOH ?? "",
      boh: payload?.boh ?? "",
      lmp: payload?.lmp ? moment(payload.lmp).format("YYYY-MM-DD") : "",
      edd: payload?.edd ? moment(payload.edd).format("YYYY-MM-DD") : "",
      testName: payload?.testName ?? "",
      highRiskFactors: payload?.highRiskFactors ?? "",
      id: payload?.id ?? 0,
    };

    try {
      const response = await saveANCRecordApi(finalPayload);

      if (response?.success) {
        notify(response.message, "success");
        fetchData();
        setPayload({
          transactionID: "",
          patientID: "",
          ivfID: "",
          isPH: "",
          ph: "",
          isHypothyroidism: "",
          hypothyroidism: "",
          isDiab: "",
          isElderlyPrimi: "",
          elderlyPrimi: "",
          isMellit: "",
          mellit: "",
          isPreviousSurgery: "",
          previousSurgery: "",
          isGesta: "",
          gesta: "",
          isBOH: "",
          boh: "",
          lmp: new Date(),
          edd: new Date(),
          testName: "",
          highRiskFactors: "",
          id: "0",
        });

        setIsEdit(false);
      } else {
        notify(response?.message, "error");
      }
    } catch (error) {
      notify(t("Something went wrong"), "error");
    }
  };

  const fetchData = async () => {
    const res = await bindDetailsApi(transactionID);
    if (res?.success) {
      setTableData(res?.data);
    } else {
      notify(res?.message, "error");
      setTableData([]);
    }
  };
  useEffect(() => {
    fetchData();
  }, []);

  const handleSelect = (name, val) => {
    setPayload((prev) => ({
      ...prev,
      [name]: val?.value || "",
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPayload((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  const hanldleprint = async () => {
    try {
      const response = await blankPrint_ANCReport(1);

      if (response?.success) {
        RedirectURL(response?.data?.pdfUrl);
      }
    } catch (error) {
      notify(error?.message || "Print error", "error");
    }
  };

  const handleRowPrint = async (item) => {
    try {
      const response = await printApi(transactionID, item?.ID);
      if (response?.success) {
        RedirectURL(response?.data?.pdfUrl);
      }
    } catch (error) {
      notify(error?.message || "Print error", "error");
    }
  };

  const yesNoOptions = [
    { label: t("Yes"), value: "1" },
    { label: t("No"), value: "0" },
  ];

  const handleEdit = (item) => {
    setPayload({
      transactionID: transactionID,
      patientID: patientID,
      ivfID: item?.IVFID || "",
      isPH: item?.IsPH?.toString(),
      ph: item?.PH || "",
      isHypothyroidism: item?.IsHypothyroidism?.toString(),
      hypothyroidism: item?.Hypothyroidism || "",
      isDiab: item?.IsDiab?.toString(),
      isElderlyPrimi: item?.IsElderlyPrimi?.toString(),
      elderlyPrimi: item?.ElderlyPrimi || "",
      isMellit: item?.IsMellit?.toString(),
      mellit: item?.Mellit || "",
      isPreviousSurgery: item?.IsPreviousSurgery?.toString(),
      previousSurgery: item?.PreviousSurgery || "",
      isGesta: item?.IsGesta?.toString(),
      gesta: item?.Gesta || "",
      isBOH: item?.IsBOH?.toString(),
      boh: item?.BOH || "",
      lmp: item?.LMP ? moment(item.LMP, "DD-MMM-YYYY").toDate() : "",
      edd: item?.EDD ? moment(item.EDD, "DD-MMM-YYYY").toDate() : "",
      testName: item?.TestName || "",
      highRiskFactors: item?.HighRiskFactors || "",
      id: item?.ID?.toString(),
    });

    setIsEdit(true);
  };

  return (
    <>
      <div className="patient_registration card mt-2">
        {/* <Heading title={t("ANC Record")} /> */}
        <Heading title={t("High Risk Factors")} isBreadcrumb={false} />

        <div className="row p-2">
          <ReactSelect
            placeholderName={t("PH")}
            id="isPH"
            name="isPH"
            searchable={true}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            removeIsClearable={true}
            dynamicOptions={yesNoOptions}
            value={payload?.isPH}
            handleChange={handleSelect}
          />
          <Input
            className="form-control"
            type="text"
            name="ph"
            id="ph"
            placeholder=""
            lable={t("PH Txt")}
            value={payload.ph}
            onChange={handleChange}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
          />
          <ReactSelect
            placeholderName={t(" Hypothyroidism")}
            id="isHypothyroidism"
            name="isHypothyroidism"
            searchable={true}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            removeIsClearable={true}
            dynamicOptions={yesNoOptions}
            value={payload?.isHypothyroidism}
            handleChange={handleSelect}
          />
          <Input
            type="text"
            id="hypothyroidism"
            name="hypothyroidism"
            placeholder=""
            lable={t("Hypothyroidism Txt")}
            value={payload.hypothyroidism}
            onChange={handleChange}
            className="form-control"
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
          />

          <ReactSelect
            placeholderName={t("Diab")}
            id="isDiab"
            name="isDiab"
            searchable={true}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            removeIsClearable={true}
            dynamicOptions={yesNoOptions}
            value={payload?.isDiab}
            handleChange={handleSelect}
          />
          <ReactSelect
            placeholderName={t("Elderly Primi")}
            id="isElderlyPrimi"
            name="isElderlyPrimi"
            searchable={true}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            removeIsClearable={true}
            dynamicOptions={yesNoOptions}
            value={payload?.isElderlyPrimi}
            handleChange={handleSelect}
          />

          <Input
            type="text"
            id="elderlyPrimi"
            name="elderlyPrimi"
            placeholder=""
            lable={t("Elderly Primi Txt")}
            value={payload.elderlyPrimi}
            onChange={handleChange}
            className="form-control"
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
          />
          <ReactSelect
            placeholderName={t("Mellit")}
            id="isMellit"
            name="isMellit"
            searchable={true}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            removeIsClearable={true}
            dynamicOptions={yesNoOptions}
            value={payload?.isMellit}
            handleChange={handleSelect}
          />
          <Input
            type="text"
            id="mellit"
            name="mellit"
            placeholder=""
            lable={t("Mellit")}
            value={payload.mellit}
            onChange={handleChange}
            className="form-control"
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
          />
          <ReactSelect
            placeholderName={t("Previous Surgery")}
            id="isPreviousSurgery"
            name="isPreviousSurgery"
            searchable={true}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            removeIsClearable={true}
            dynamicOptions={yesNoOptions}
            value={payload?.isPreviousSurgery}
            handleChange={handleSelect}
          />
          <Input
            type="text"
            id="previousSurgery"
            name="previousSurgery"
            placeholder=""
            lable={t("Previous Surgery Txt")}
            value={payload.previousSurgery}
            onChange={handleChange}
            className="form-control"
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
          />
          <ReactSelect
            placeholderName={t("Gesta")}
            id="isGesta"
            name="isGesta"
            searchable={true}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            removeIsClearable={true}
            dynamicOptions={yesNoOptions}
            value={payload?.isGesta}
            handleChange={handleSelect}
          />
          <Input
            type="text"
            id="gesta"
            name="gesta"
            placeholder=""
            lable={t("Gesta Txt")}
            value={payload.gesta}
            onChange={handleChange}
            className="form-control"
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
          />
          <ReactSelect
            placeholderName={t("BOH")}
            id="isBOH"
            name="isBOH"
            searchable={true}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            removeIsClearable={true}
            dynamicOptions={yesNoOptions}
            value={payload?.isBOH}
            handleChange={handleSelect}
          />
          <Input
            type="text"
            id="boh"
            name="boh"
            placeholder=""
            lable={t("BOH Txt")}
            value={payload.boh}
            onChange={handleChange}
            className="form-control"
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
          />
        </div>
        <Heading title={t("Mandatory fields")} />
        <div className="row p-2">
          <DatePicker
            placeholder={VITE_DATE_FORMAT}
            className="custom-calendar"
            lable={t("LMP")}
            name="lmp"
            id="lmp"
            value={payload?.lmp}
            // showTime
            hourFormat="12"
            handleChange={handleChange}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
          />
          <DatePicker
            placeholder={VITE_DATE_FORMAT}
            className="custom-calendar"
            lable={t("EDD")}
            name="edd"
            id="edd"
            value={payload?.edd}
            // showTime
            hourFormat="12"
            handleChange={handleChange}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
          />

          <Input
            type="text"
            name="testName"
            id="testName"
            placeholder=""
            lable={t("Test Name")}
            value={payload.testName}
            onChange={handleChange}
            className="form-control"
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
          />
        </div>

        <Heading title={t("High Risk Factors")} />
        <div className="row p-2">
          <TextAreaInput
            name="highRiskFactors"
            id="highRiskFactors"
            placeholder=""
            lable={t("High Risk Factors")}
            value={payload.highRiskFactors}
            onChange={handleChange}
            rows={2}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
          />

          <button
            type="button"
            className="btn btn-primary mr-2"
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            onClick={handleSave}
          >
            {isEdit ? t("Update") : t("Save")}
          </button>

          <button
            type="button"
            className="btn btn-success"
            onClick={hanldleprint}
          >
            {t("Print Blanck")}
          </button>
        </div>
      </div>
      {tableData && tableData.length > 0 && (
        <>
          <div className="patient_registration card mt-2"></div>
          <Heading title={t("High Risk Factors Details")} />
          <Tables
            thead={THEAD}
            tbody={tableData.map((item, index) => ({
              SNo: index + 1,
              PH: item?.PH,
              Hypothyroidism: item?.Hypothyroidism,
              "Elderly Primi": item?.ElderlyPrimi,
              Mellit: item?.Mellit,
              "Previous Surgery": item?.PreviousSurgery,
              Gesta: item?.Gesta,
              BOH: item?.BOH,
              "High Risk Factors": item?.HighRiskFactors,

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
export default ANCRecord;
