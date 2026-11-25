import { useState } from "react";
import DatePicker from "../../formComponent/DatePicker";
import Input from "../../formComponent/Input";
import ReactSelect from "../../formComponent/ReactSelect";
import TimePicker from "../../formComponent/TimePicker";
import Heading from "../../UI/Heading";
import Tables from "../../UI/customTable";
import { useTranslation } from "react-i18next";
import {
  bindDetails_IUI_SHEETApi,
  blankPrint_IUI_SHEET,
  print_IUI_SHEETApi,
  save_IUI_SHEETApi,
} from "../../../networkServices/IVFApi";
import { notify } from "../../../utils/utils";
import { RedirectURL } from "../../../networkServices/PDFURL";
import moment from "moment/moment";

const IUISheet = (data) => {
  const { VITE_DATE_FORMAT } = import.meta.env;
  const [t] = useTranslation();
  const { TransactionID: transactionID, PatientID: patientID } =
    data?.patientDetail || {};
  const [payload, setPayload] = useState({
    transactionID: "",
    patientID: "",
    ivfid: "",
    doa: new Date(),
    toa: "",
    cfbTemp: "",
    cfbPulse: "",
    cfbbp: "",
    cfbrs: "",
    cfbcvs: "",
    cfaTemp: "",
    cfaPulse: "",
    cfabp: "",
    cfars: "",
    cfacvs: "",
    consentInform67: "",
    iuiConsent: "",
    patientIDCrossChecked: "",
    iuiCannulaBy: "",
    quantityOfWashedSemen: "",
    postWashCount: "",
    postWashMotility: "",
    freshFreeze: "",
    husbandDonor: "",
    otherInstructions: "",
    medication: "",
    id: "",
  });
  const THEAD = [
    { name: t("Patient Name") },
    { name: t("DOA") },
    { name: t("TOA") },
    { name: t("CFBTemp") },
    { name: t("CFBPulse") },
    { name: t("CFBBP") },
    { name: t("CFBRS") },
    { name: t("CFBCVS") },
    { name: t("Edit"), width: "1%" },
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
      const response = await bindDetails_IUI_SHEETApi(transactionID);
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
  const hanldleprint = async () => {
    try {
      const response = await blankPrint_IUI_SHEET(1);

      if (response?.success) {
        RedirectURL(response?.data?.pdfUrl);
      }
    } catch (error) {
      notify(error?.message || "Print error", "error");
    }
  };
  const handleRowPrint = async (item) => {
    try {
      const response = await print_IUI_SHEETApi(transactionID, item?.ID);
      if (response?.success) {
        RedirectURL(response?.data?.pdfUrl);
      }
    } catch (error) {
      notify(error?.message || "Print error", "error");
    }
  };
  const handleSave = async () => {
    try {
      const apiPayload = {
        id: payload.id || "0",
        patientID,
        transactionID,
        ivfid: payload?.ivfid || "",
        doa: payload?.doa ? moment(payload.doa).format("YYYY-MM-DD") : "",
        toa: payload?.toa
          ? moment(payload.toa, ["HH:mm", "hh:mm A"]).format("HH:mm:ss")
          : "",

        cfbTemp: payload?.cfbTemp || "",
        cfbPulse: payload?.cfbPulse || "",
        cfbbp: payload?.cfbbp || "",
        cfbrs: payload?.cfbrs || "",
        cfbcvs: payload?.cfbcvs || "",

        cfaTemp: payload?.cfaTemp || "",
        cfaPulse: payload?.cfaPulse || "",
        cfabp: payload?.cfabp || "",
        cfars: payload?.cfars || "",
        cfacvs: payload?.cfacvs || "",

        consentInform67: payload?.consentInform67 || "",
        iuiConsent: payload?.iuiConsent || "",
        patientIDCrossChecked: payload?.patientIDCrossChecked || "",

        iuiCannulaBy: payload?.iuiCannulaBy || "",
        quantityOfWashedSemen: payload?.quantityOfWashedSemen || "",
        postWashCount: payload?.postWashCount || "",
        postWashMotility: payload?.postWashMotility || "",
        freshFreeze: payload?.freshFreeze || "",
        husbandDonor: payload?.husbandDonor || "",

        otherInstructions: payload?.otherInstructions || "",
        medication: payload?.medication || "",
      };

      const response = await save_IUI_SHEETApi(apiPayload);

      if (response?.success) {
        notify(response?.message || "Saved successfully", "success");
        fetchData();
        setIsEdit(false);
        resetForm();
      } else {
        notify(response?.message, "error");
      }
    } catch (error) {
      notify(error?.response?.data?.message, "error");
      console.error(error);
    }
  };
  const resetForm = () => {
    setPayload({
      transactionID: "",
      patientID: "",
      ivfid: "",
      doa: new Date(),
      toa: "",
      cfbTemp: "",
      cfbPulse: "",
      cfbbp: "",
      cfbrs: "",
      cfbcvs: "",
      cfaTemp: "",
      cfaPulse: "",
      cfabp: "",
      cfars: "",
      cfacvs: "",
      consentInform67: "",
      iuiConsent: "",
      patientIDCrossChecked: "",
      iuiCannulaBy: "",
      quantityOfWashedSemen: "",
      postWashCount: "",
      postWashMotility: "",
      freshFreeze: "",
      husbandDonor: "",
      otherInstructions: "",
      medication: "",
      id: "",
    });
  };
  const handleEdit = (item) => {
    setPayload({
      id: item?.ID || "",
      patientID: item?.PatientID || patientID,
      transactionID: item?.TransactionID || transactionID,
      ivfid: item?.IVFID || "",

      doa: item?.DOA ? moment(item.DOA, "DD-MMM-YYYY").toDate() : new Date(),

      toa: item?.TOA || "",
      toa: item?.TOA ? moment(item.TOA, "HH:mm:ss").toDate() : "",

      cfbTemp: item?.CFBTemp || "",
      cfbPulse: item?.CFBPulse || "",
      cfbbp: item?.CFBBP || "",
      cfbrs: item?.CFBRS || "",
      cfbcvs: item?.CFBCVS || "",

      cfaTemp: item?.CFATemp || "",
      cfaPulse: item?.CFAPulse || "",
      cfabp: item?.CFABP || "",
      cfars: item?.CFARS || "",
      cfacvs: item?.CFACVS || "",

      consentInform67: item?.ConsentInform67?.toString() || "",
      iuiConsent: item?.IUIConsent?.toString() || "",
      patientIDCrossChecked: item?.PatientIDCrossChecked?.toString() || "",

      iuiCannulaBy: item?.IUICannulaBy || "",
      quantityOfWashedSemen: item?.QuantityOfWashedSemen || "",
      postWashCount: item?.PostWashCount || "",
      postWashMotility: item?.PostWashMotility || "",
      freshFreeze: item?.FreshFreeze || "",
      husbandDonor: item?.HusbandDonor || "",

      otherInstructions: item?.OtherInstructions || "",
      medication: item?.Medication || "",
    });

    setIsEdit(true);
  };

  return (
    <>
      <div className="m-2 spatient_registration_card">
        <div className="patient_registration card">
          <Heading title={t("IUI SHEET")} />
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

            <TimePicker
              placeholderName={t("T.O.A.")}
              lable={t("T.O.A.")}
              id="toa"
              name="toa"
              value={payload?.toa}
              handleChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
          </div>
          <Heading title={t("Clinical Findings Before IUI")} />
          <div className="row p-2">
            <Input
              type="text"
              className="form-control"
              placeholder=""
              lable={t("Temperature")}
              id="cfbTemp"
              name="cfbTemp"
              value={payload?.cfbTemp}
              onChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
            <Input
              type="text"
              className="form-control"
              placeholder=""
              lable={t("Pulse")}
              id="cfbPulse"
              name="cfbPulse"
              value={payload?.cfbPulse}
              onChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
            <Input
              type="text"
              className="form-control"
              placeholder=""
              lable={t("B.P.")}
              id="cfbbp"
              name="cfbbp"
              value={payload?.cfbbp}
              onChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
            <Input
              type="text"
              className="form-control"
              placeholder=""
              lable={t("RS")}
              id="cfbrs"
              name="cfbrs"
              value={payload?.cfbrs}
              onChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
            <Input
              type="text"
              className="form-control"
              placeholder=""
              lable={t("CVS")}
              id="cfbcvs"
              name="cfbcvs"
              value={payload?.cfbcvs}
              onChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
          </div>
          <Heading title={t("Clinical Findings After IUI")} />
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
          <Heading title={t("Checklist")} />
          <div className="row p-2">
            <ReactSelect
              placeholder=""
              placeholderName={t("Consent In Form-6,7")}
              id="consentInform67"
              name="consentInform67"
              value={payload?.consentInform67}
              handleChange={handleSelect}
              dynamicOptions={yesNoOptions}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
            <ReactSelect
              placeholder=""
              placeholderName={t("IUI Consent")}
              id="iuiConsent"
              name="iuiConsent"
              value={payload?.iuiConsent}
              handleChange={handleSelect}
              dynamicOptions={yesNoOptions}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
            <ReactSelect
              placeholder=""
              placeholderName={t("Patient ID Cross Checked")}
              id="patientIDCrossChecked"
              name="patientIDCrossChecked"
              value={payload?.patientIDCrossChecked}
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
              lable={t("IUI Cannula By")}
              id="iuiCannulaBy"
              name="iuiCannulaBy"
              value={payload?.iuiCannulaBy}
              onChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
            <Input
              type="text"
              className="form-control"
              placeholder=""
              lable={t("Quantity Of Washed Semen")}
              id="quantityOfWashedSemen"
              name="quantityOfWashedSemen"
              value={payload?.quantityOfWashedSemen}
              onChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
            <Input
              type="text"
              className="form-control"
              placeholder=""
              lable={t("Post Wash Count")}
              id="postWashCount"
              name="postWashCount"
              value={payload?.postWashCount}
              onChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
            <Input
              type="text"
              className="form-control"
              placeholder=""
              lable={t("Post Wash Motility")}
              id="postWashMotility"
              name="postWashMotility"
              value={payload?.postWashMotility}
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
              lable={t("Husband/Donor")}
              id="husbandDonor"
              name="husbandDonor"
              value={payload?.husbandDonor}
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
              TOA: item?.TOA || "",
              CFBTemp: item?.CFATemp || "",
              CFBPulse: item?.CFAPulse || "",
              CFBBP: item?.CFABP || "",
              CFBRS: item?.CFARS || "",
              CFBCVS: item?.CFACVS || "",
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

export default IUISheet;
