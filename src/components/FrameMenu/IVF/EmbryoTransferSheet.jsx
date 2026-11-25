import { useEffect, useState } from "react";
import DatePicker from "../../formComponent/DatePicker";
import Input from "../../formComponent/Input";
import ReactSelect from "../../formComponent/ReactSelect";
import TimePicker from "../../formComponent/TimePicker";
import Heading from "../../UI/Heading";
import Tables from "../../UI/customTable";
import { useTranslation } from "react-i18next";
import moment from "moment/moment";
import {
  bindDetails_ET_SHEETApi,
  blankPrint_ET_SHEETApi,
  print_ET_SHEETApi,
  save_ET_SHEETApi,
} from "../../../networkServices/IVFApi";
import { notify } from "../../../utils/utils";
import { RedirectURL } from "../../../networkServices/PDFURL";

const EmbryoTransferSheet = (data) => {
  const { VITE_DATE_FORMAT } = import.meta.env;
  const [t] = useTranslation();
  const { TransactionID: transactionID, PatientID: patientID } =
    data?.patientDetail || {};
  const [payload, setPayload] = useState({
    transactionID: "",
    patientID: "",
    ivfid: "",
    doa: new Date(),
    dop: new Date(),
    dod: new Date(),
    toa: "",
    top: "",
    tod: "",
    cfaTemp: "",
    cfaPulse: "",
    cfabp: "",
    cfars: "",
    cfacvs: "",
    cfdTemp: "",
    cfdPulse: "",
    cfdbp: "",
    cfdrs: "",
    cfdcvs: "",
    consentInformI: "",
    embryoTransferConsent: "",
    patientCrossChecked: "",
    carriedOutBy: "",
    methodUsing: "",
    doctorName: "",
    noofEmbryoTransfer: "",
    day: "",
    stage: "",
    freshFreeze: "",
    selfODBDDS: "",
    otherInstructions: "",
    medication: "",
    id: "",
  });
  const THEAD = [
    { name: t("Patient Name") },
    { name: t("DOA") },
    { name: t("DOP") },
    { name: t("DOD") },
    { name: t("TOA") },
    { name: t("TOP") },
    { name: t("TOD") },
    { name: t("Edit"), width: "2%" },
    { name: t("Print"), width: "2%" },
  ];
  const yesNoOptions = [
    { label: t("Yes"), value: "1" },
    { label: t("No"), value: "0" },
  ];
  const [tableData, setTableData] = useState([]);
  const [isEdit, setIsEdit] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPayload((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  const handleSelect = (name, val) => {
    setPayload((prev) => ({
      ...prev,
      [name]: val?.value || "",
    }));
  };

  const fetchData = async () => {
    try {
      const response = await bindDetails_ET_SHEETApi(transactionID);

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

  const handleSave = async () => {
    try {
      const apiPayload = {
        transactionID: transactionID,
        patientID: patientID,
        ivfid: payload?.ivfid || "",

        doa: payload?.doa ? moment(payload.doa).format("YYYY-MM-DD") : "",

        dop: payload?.dop ? moment(payload.dop).format("YYYY-MM-DD") : "",

        dod: payload?.dod ? moment(payload.dod).format("YYYY-MM-DD") : "",

        toa: payload?.toa ? moment(payload.toa).format("HH:mm:ss") : "",

        top: payload?.top ? moment(payload.top).format("HH:mm:ss") : "",

        tod: payload?.tod ? moment(payload.tod).format("HH:mm:ss") : "",

        cfaTemp: payload?.cfaTemp || "",
        cfaPulse: payload?.cfaPulse || "",
        cfabp: payload?.cfabp || "",
        cfars: payload?.cfars || "",
        cfacvs: payload?.cfacvs || "",

        cfdTemp: payload?.cfdTemp || "",
        cfdPulse: payload?.cfdPulse || "",
        cfdbp: payload?.cfdbp || "",
        cfdrs: payload?.cfdrs || "",
        cfdcvs: payload?.cfdcvs || "",

        consentInformI: payload?.consentInformI || "",
        embryoTransferConsent: payload?.embryoTransferConsent || "",
        patientCrossChecked: payload?.patientCrossChecked || "",

        carriedOutBy: payload?.carriedOutBy || "",
        methodUsing: payload?.methodUsing || "",
        doctorName: payload?.doctorName || "",
        noofEmbryoTransfer: payload?.noofEmbryoTransfer || "",
        day: payload?.day || "",
        stage: payload?.stage || "",
        freshFreeze: payload?.freshFreeze || "",
        selfODBDDS: payload?.selfODBDDS || "",

        otherInstructions: payload?.otherInstructions || "",
        medication: payload?.medication || "",

        id: payload?.id || 0,
      };

      const response = await save_ET_SHEETApi(apiPayload);

      if (response?.success) {
        notify(response?.message, "success");
        fetchData();
        resetForm();
        setIsEdit();
      } else {
        notify(response?.message, "error");
      }
    } catch (error) {
      notify(error?.response?.data?.message || "Something went wrong", "error");
    }
  };
  const handleRowPrint = async (item) => {
    try {
      const response = await print_ET_SHEETApi(transactionID, item?.ID);
      if (response?.success) {
        RedirectURL(response?.data?.pdfUrl);
      }
    } catch (error) {
      notify(error?.message || "Print error", "error");
    }
  };
  const hanldleprint = async () => {
    try {
      const response = await blankPrint_ET_SHEETApi(1);

      if (response?.success) {
        RedirectURL(response?.data?.pdfUrl);
      }
    } catch (error) {
      notify(error?.message || "Print error", "error");
    }
  };
  const handleEdit = (item) => {
    setPayload({
      transactionID: item?.TransactionID || "",
      patientID: item?.PatientID || "",
      ivfid: item?.IVFID || "",

      doa: item?.DOA ? moment(item.DOA, "DD-MMM-YYYY").toDate() : "",
      dop: item?.DOP ? moment(item.DOP, "DD-MMM-YYYY").toDate() : "",
      dod: item?.DOD ? moment(item.DOD, "DD-MMM-YYYY").toDate() : "",

      toa: item?.TOA ? moment(item.TOA, "hh:mm A").toDate() : "",
      top: item?.TOP ? moment(item.TOP, "hh:mm A").toDate() : "",
      tod: item?.TOD ? moment(item.TOD, "hh:mm A").toDate() : "",

      cfaTemp: item?.CFATemp || "",
      cfaPulse: item?.CFAPulse || "",
      cfabp: item?.CFABP || "",
      cfars: item?.CFARS || "",
      cfacvs: item?.CFACVS || "",

      cfdTemp: item?.CFDTemp || "",
      cfdPulse: item?.CFDPulse || "",
      cfdbp: item?.CFDBP || "",
      cfdrs: item?.CFDRS || "",
      cfdcvs: item?.CFDCVS || "",

      consentInformI: item?.ConsentInformI ?? "",
      embryoTransferConsent: item?.EmbryoTransferConsent ?? "",
      patientCrossChecked: item?.PatientCrossChecked ?? "",

      carriedOutBy: item?.CarriedOutBy || "",
      methodUsing: item?.MethodUsing || "",
      doctorName: item?.DoctorName || "",
      noofEmbryoTransfer: item?.NoofEmbryoTransfer || "",
      day: item?.Day || "",
      stage: item?.Stage || "",
      freshFreeze: item?.FreshFreeze || "",
      selfODBDDS: item?.SelfODBDDS || "",

      otherInstructions: item?.OtherInstructions || "",
      medication: item?.Medication || "",

      id: item?.ID || 0,
    });

    setIsEdit(true);
  };

  const resetForm = () => {
    setPayload({
      transactionID: "",
      patientID: "",
      ivfid: "",
      doa: "",
      dop: "",
      dod: "",
      toa: "",
      top: "",
      tod: "",
      cfaTemp: "",
      cfaPulse: "",
      cfabp: "",
      cfars: "",
      cfacvs: "",
      cfdTemp: "",
      cfdPulse: "",
      cfdbp: "",
      cfdrs: "",
      cfdcvs: "",
      consentInformI: "",
      embryoTransferConsent: "",
      patientCrossChecked: "",
      carriedOutBy: "",
      methodUsing: "",
      doctorName: "",
      noofEmbryoTransfer: "",
      day: "",
      stage: "",
      freshFreeze: "",
      selfODBDDS: "",
      otherInstructions: "",
      medication: "",
      id: "",
    });
  };
  return (
    <>
      <div className="m-2 spatient_registration_card">
        <div className="patient_registration card">
          <Heading title={t("Entry details")} isBreadcrumb={false} />
          <div className="row p-2">
            <DatePicker
              placeholder={VITE_DATE_FORMAT}
              className="custom-calendar"
              lable={t("D.O.A.")}
              name="doa"
              id="doa"
              value={payload?.doa}
              showTime
              hourFormat="12"
              handleChange={handleChange}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            />
            <DatePicker
              placeholder={VITE_DATE_FORMAT}
              className="custom-calendar"
              lable={t("D.O.P.")}
              name="dop"
              id="dop"
              value={payload?.dop}
              showTime
              hourFormat="12"
              handleChange={handleChange}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            />
            <DatePicker
              placeholder={VITE_DATE_FORMAT}
              className="custom-calendar"
              lable={t("D.O.D.")}
              name="dod"
              id="witness1Date"
              value={payload?.dod}
              showTime
              hourFormat="12"
              handleChange={handleChange}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            />
            <TimePicker
              placeholderName={t("T.O.A.")}
              lable={t("T.O.A.")}
              id="toa"
              name="toa"
              value={payload?.toa}
              handleChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
            <TimePicker
              placeholderName={t("T.O.P.")}
              lable={t("T.O.P.")}
              id="top"
              name="top"
              value={payload?.top}
              handleChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />{" "}
            <TimePicker
              placeholderName={t("T.O.D.")}
              lable={t("T.O.D.")}
              id="tod"
              name="tod"
              value={payload?.tod}
              handleChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />{" "}
          </div>
          <Heading title={t("Clinical Findings at the time of admission")} />
          <div className="row p-2">
            <Input
              type="text"
              className="form-control"
              placeholder=""
              lable={t("Temperature")}
              id="cfaTemp"
              name="cfaTemp"
              value={payload?.cfaTemp}
              onChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
            <Input
              type="text"
              className="form-control"
              placeholder=""
              lable={t("Pulse")}
              id="cfaPulse"
              name="cfaPulse"
              value={payload?.cfaPulse}
              onChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
            <Input
              type="text"
              className="form-control"
              placeholder=""
              lable={t("B.P.")}
              id="cfabp"
              name="cfabp"
              value={payload?.cfabp}
              onChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
            <Input
              type="text"
              className="form-control"
              placeholder=""
              lable={t("RS")}
              id="cfars"
              name="cfars"
              value={payload?.cfars}
              onChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
            <Input
              type="text"
              className="form-control"
              placeholder=""
              lable={t("CVS")}
              id="cfacvs"
              name="cfacvs"
              value={payload?.cfacvs}
              onChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
          </div>
          <Heading title={t("Clinical Findings at the time of Discharge")} />
          <div className="row p-2">
            <Input
              type="text"
              className="form-control"
              placeholder=""
              lable={t("Temperature")}
              id="cfdTemp"
              name="cfdTemp"
              value={payload?.cfdTemp}
              onChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
            <Input
              type="text"
              className="form-control"
              placeholder=""
              lable={t("Pulse")}
              id="cfdPulse"
              name="cfdPulse"
              value={payload?.cfdPulse}
              onChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
            <Input
              type="text"
              className="form-control"
              placeholder=""
              lable={t("B.P.")}
              id="cfdbp"
              name="cfdbp"
              value={payload?.cfdbp}
              onChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
            <Input
              type="text"
              className="form-control"
              placeholder=""
              lable={t("RS")}
              id="cfdrs"
              name="cfdrs"
              value={payload?.cfdrs}
              onChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
            <Input
              type="text"
              className="form-control"
              placeholder=""
              lable={t("CVS")}
              id="cfdcvs"
              name="cfdcvs"
              value={payload?.cfdcvs}
              onChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
          </div>
          <Heading title={t("Checklist")} />
          <div className="row p-2">
            <ReactSelect
              placeholderName={t("Consent In Form-I")}
              id="consentInformI"
              name="consentInformI"
              removeIsClearable={true}
              searchable={true}
              value={payload?.consentInformI}
              handleChange={handleSelect}
              dynamicOptions={yesNoOptions}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
            <ReactSelect
              placeholder=""
              placeholderName={t("Embryo Transfer Consent")}
              id="embryoTransferConsent"
              name="embryoTransferConsent"
              value={payload?.embryoTransferConsent}
              handleChange={handleSelect}
              dynamicOptions={yesNoOptions}
              removeIsClearable={true}
              searchable={true}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
            <ReactSelect
              placeholder=""
              placeholderName={t("Patient Cross Checked")}
              id="patientCrossChecked"
              name="patientCrossChecked"
              removeIsClearable={true}
              searchable={true}
              value={payload?.patientCrossChecked}
              handleChange={handleSelect}
              dynamicOptions={yesNoOptions}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
          </div>
          <Heading title={t("Operative Procedure")} />
          <div className="row p-2">
            <Input
              type="text"
              className="form-control"
              placeholder=""
              lable={t("Carried Out By")}
              id="carriedOutBy"
              name="carriedOutBy"
              value={payload?.carriedOutBy}
              onChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
            <Input
              type="text"
              className="form-control"
              placeholder=""
              lable={t("Method Using")}
              id="methodUsing"
              name="methodUsing"
              value={payload?.methodUsing}
              onChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
            <Input
              type="text"
              className="form-control"
              placeholder=""
              lable={t("Doctor Name")}
              id="doctorName"
              name="doctorName"
              value={payload?.doctorName}
              onChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
            <Input
              type="text"
              className="form-control"
              placeholder=""
              lable={t("No. of Embryo Transfer")}
              id="noofEmbryoTransfer"
              name="noofEmbryoTransfer"
              value={payload?.noofEmbryoTransfer}
              onChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
            <Input
              type="text"
              className="form-control"
              placeholder=""
              lable={t("Day")}
              id="day"
              name="day"
              value={payload?.day}
              onChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
            <Input
              type="text"
              className="form-control"
              placeholder=""
              lable={t("Stage")}
              id="stage"
              name="stage"
              value={payload?.stage}
              onChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
            <Input
              type="text"
              className="form-control"
              placeholder=""
              lable={t("Fresh/Freeze")}
              id="freshFreeze"
              name="freshFreeze"
              value={payload?.freshFreeze}
              onChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
            <Input
              type="text"
              className="form-control"
              placeholder=""
              lable={t("Self/OD/BD/DS")}
              id="selfODBDDS"
              name="selfODBDDS"
              value={payload?.selfODBDDS}
              onChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
          </div>
          <Heading title={t("Post Procedure Advice")} />
          <div className="row p-2">
            <Input
              type="text"
              placeholder=""
              id="otherInstructions"
              name="otherInstructions"
              lable={t("Other Instructions")}
              className="form-control"
              onChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
              value={payload?.otherInstructions}
            />
            <Input
              type="text"
              placeholder=""
              id="medication"
              name="medication"
              lable={t("Medication")}
              className="form-control"
              onChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
              value={payload?.medication}
            />
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
          <Heading title={t("History")} />
          <Tables
            thead={THEAD}
            tbody={tableData?.map((item, index) => ({
              "Patient Name": item?.PatientName || "",
              DOA: item?.DOA || "",
              DOP: item?.DOP || "",
              DOD: item?.DOD || "",
              TOA: item?.TOA || "",
              TOP: item?.TOP || "",
              TOD: item?.TOD || "",
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

export default EmbryoTransferSheet;
