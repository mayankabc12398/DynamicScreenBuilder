import { useTranslation } from "react-i18next";
import { notify } from "../../../utils/utils";
import { useEffect, useState } from "react";
import {
  bindDetails_Physical_Systemic,
  blankPrint_Physical_Systemic,
  print_Physical_Systemic,
  save_Physical_Systemic,
} from "../../../networkServices/IVFApi";
import Heading from "../../UI/Heading";
import Tables from "../../UI/customTable";
import ReactSelect from "../../formComponent/ReactSelect";
import TextAreaInput from "../../formComponent/TextAreaInput";
import { RedirectURL } from "../../../networkServices/PDFURL";
import Input from "../../formComponent/Input";

const PhysicalAndSystemicExamination = (data) => {
  const [t] = useTranslation();
  const { TransactionID: transactionID, PatientID: patientID } =
    data?.patientDetail || {};
  const [payload, setPayload] = useState({
    id: "",
    patientID: "",
    transactionID: "",
    ivfid: "",
    height: "",
    weight: "",
    bmi: "",
    pallor: "",
    icterus: "",
    edema: "",
    temperature: "",
    pulseRate: "",
    respirationRate: "",
    bloodPressure: "",
    spO2: "",
    respiratorySystem: "",
    cardiovascularSystem: "",
    breast: "",
    pa: "",
    cervix: "",
    vaginal: "",
    discharge: "",
    uterus: "",
    size: "",
    mobileFixed: "",
    fornices: "",
    tenderness: "",
    pr: "",
    provisionalDiagnosis: "",
  });
  const THEAD = [
    { name: t("SNo"), width: "2%" },
    { name: t("Height") },
    { name: t("Weight") },
    { name: t("Breast") },
    { name: t("PA") },
    { name: t("Provisional Diagnosis") },
    { name: t("CreatedBy") },
    { name: t("CreatedDatetime") },
    { name: t("Edit"), width: "2%" },
    { name: t("Print"), width: "2%" },
  ];
  const [isEdit, setIsEdit] = useState(false);
  const [tableData, setTableData] = useState([]);
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
  const fetchData = async () => {
    try {
      const response = await bindDetails_Physical_Systemic(transactionID);

      if (response?.success) {
        setTableData(response.data || []);
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

  useEffect(() => {
    fetchData();
  }, []);
  const handleSave = async () => {
    const finalPayload = {
      id: payload.id || "0",
      patientID,
      transactionID,
      ivfid: payload.ivfid || "",

      height: payload.height || "",
      weight: payload.weight || "",
      bmi: payload.bmi || "",
      pallor: payload.pallor || "",
      icterus: payload.icterus || "",
      edema: payload.edema || "",
      temperature: payload.temperature || "",
      pulseRate: payload.pulseRate || "",
      respirationRate: payload.respirationRate || "",
      bloodPressure: payload.bloodPressure || "",
      spO2: payload.spO2 || "",
      respiratorySystem: payload.respiratorySystem || "",
      cardiovascularSystem: payload.cardiovascularSystem || "",
      breast: payload.breast || "",
      pa: payload.pa || "",
      cervix: payload.cervix || "",
      vaginal: payload.vaginal || "",
      discharge: payload.discharge || "",
      uterus: payload.uterus || "",
      size: payload.size || "",
      mobileFixed: payload.mobileFixed || "",
      fornices: payload.fornices || "",
      tenderness: payload.tenderness || "",
      pr: payload.pr || "",
      provisionalDiagnosis: payload.provisionalDiagnosis || "",
    };

    try {
      const response = await save_Physical_Systemic(finalPayload);

      if (response?.success) {
        notify(response.message, "success");
        fetchData();
        resetForm();
        setIsEdit(false);
      } else {
        notify(response?.message, "error");
      }
    } catch (error) {
      notify(t("Something went wrong"), "error");
      console.error(error);
    }
  };

  const resetForm = () => {
    setPayload({
      id: "",
      patientID: "",
      transactionID: "",
      ivfid: "",
      height: "",
      weight: "",
      bmi: "",
      pallor: "",
      icterus: "",
      edema: "",
      temperature: "",
      pulseRate: "",
      respirationRate: "",
      bloodPressure: "",
      spO2: "",
      respiratorySystem: "",
      cardiovascularSystem: "",
      breast: "",
      pa: "",
      cervix: "",
      vaginal: "",
      discharge: "",
      uterus: "",
      size: "",
      mobileFixed: "",
      fornices: "",
      tenderness: "",
      pr: "",
      provisionalDiagnosis: "",
    });
  };
  const handleEdit = (item) => {
    setPayload({
      id: item?.ID || "",
      patientID,
      transactionID,
      ivfid: item?.IVFID || "",
      height: item?.Height || "",
      weight: item?.Weight || "",
      bmi: item?.BMI || "",
      pallor: item?.Pallor || "",
      icterus: item?.Icterus || "",
      edema: item?.Edema || "",
      temperature: item?.Temperature || "",
      pulseRate: item?.PulseRate || "",
      respirationRate: item?.RespirationRate || "",
      bloodPressure: item?.BloodPressure || "",
      spO2: item?.SPO2 || "",
      respiratorySystem: item?.RespiratorySystem || "",
      cardiovascularSystem: item?.CardiovascularSystem || "",
      breast: item?.Breast || "",
      pa: item?.PA || "",
      cervix: item?.Cervix || "",
      vaginal: item?.Vaginal || "",
      discharge: item?.Discharge || "",
      uterus: item?.Uterus || "",
      size: item?.Size || "",
      mobileFixed: item?.MobileFixed || "",
      fornices: item?.Fornices || "",
      tenderness: item?.Tenderness || "",
      pr: item?.PR || "",
      provisionalDiagnosis: item?.ProvisionalDiagnosis || "",
    });

    setIsEdit(true);
  };

  const hanldleprint = async () => {
    try {
      const response = await blankPrint_Physical_Systemic(1);

      if (response?.success) {
        RedirectURL(response?.data?.pdfUrl);
      }
    } catch (error) {
      notify(error?.message || "Print error", "error");
    }
  };
  const handleRowPrint = async (item) => {
    try {
      const response = await print_Physical_Systemic(transactionID, item?.ID);
      if (response?.success) {
        RedirectURL(response?.data?.pdfUrl);
      }
    } catch (error) {
      notify(error?.message || "Print error", "error");
    }
  };

  const uterusOptions = [
    { label: t("Anteverted"), value: "Anteverted " },
    { label: t("Retroverted"), value: "Retroverted" },
  ];
  const mobileFixedOptions = [
    { label: t("Mobile"), value: "Mobile " },
    { label: t("Fixed"), value: "Fixed" },
  ];
  const yesNoOptions = [
    { label: t("Yes"), value: "Yes" },
    { label: t("No"), value: "No" },
  ];
  return (
    <>
      {" "}
      <div className="m-2 spatient_registration_card">
        <div className="patient_registration card">
          <Heading
            title={t("Physical & Systemic Examination")}
            isBreadcrumb={false}
          />
          <div className="row px-2 py-2">
            <Input
              type="number"
              className="form-control"
              placeholder=""
              lable={t("Height (Cms)")}
              id="height"
              name="height"
              value={payload?.height}
              onChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
            <Input
              type="number"
              className="form-control"
              placeholder=""
              lable={t("Weight (Kgs)")}
              id="weight"
              name="weight"
              value={payload?.weight}
              onChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
            <Input
              type="number"
              className="form-control"
              placeholder=""
              lable={t("BMI")}
              id="bmi"
              name="bmi"
              value={payload?.bmi}
              onChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />{" "}
            <Input
              type="text"
              className="form-control"
              placeholder=""
              lable={t("Pallor")}
              id="pallor"
              name="pallor"
              value={payload?.pallor}
              onChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />{" "}
            <Input
              type="text"
              className="form-control"
              placeholder=""
              lable={t("Icterus")}
              id="icterus"
              name="icterus"
              value={payload?.icterus}
              onChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
            <Input
              type="text"
              className="form-control"
              placeholder=""
              lable={t("Edema")}
              id="edema"
              name="edema"
              value={payload?.edema}
              onChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
            <Input
              type="text"
              className="form-control"
              placeholder=""
              lable={t("Temperature (°C)")}
              id="temperature"
              name="temperature"
              value={payload?.temperature}
              onChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
            <Input
              type="text"
              className="form-control"
              placeholder=""
              lable={t("Pulse rate (/min)")}
              id="pulseRate"
              name="pulseRate"
              value={payload?.pulseRate}
              onChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />{" "}
            <Input
              type="text"
              className="form-control"
              placeholder=""
              lable={t("Respiration rate (/min)")}
              id="respirationRate"
              name="respirationRate"
              value={payload?.respirationRate}
              onChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
            <Input
              type="text"
              className="form-control"
              placeholder=""
              lable={t("Blood Pressure (mm/Hg)")}
              id="bloodPressure"
              name="bloodPressure"
              onChange={handleChange}
              value={payload?.bloodPressure}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />{" "}
            <Input
              type="number"
              className="form-control"
              placeholder=""
              lable={t("SPO2 (%)")}
              id="spO2"
              name="spO2"
              onChange={handleChange}
              value={payload?.spO2}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />{" "}
            <Input
              type="text"
              className="form-control"
              placeholder=""
              lable={t("R/S")}
              id="respiratorySystem"
              name="respiratorySystem"
              onChange={handleChange}
              value={payload?.respiratorySystem}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />{" "}
            <Input
              type="text"
              className="form-control"
              placeholder=""
              lable={t("CVS")}
              id="cardiovascularSystem"
              name="cardiovascularSystem"
              onChange={handleChange}
              value={payload?.cardiovascularSystem}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
          </div>
          <Heading title={t("Systemic Examination")} isBreadcrumb={false} />
          <div className="row p-2">
            <Input
              type="text"
              className="form-control"
              placeholder=""
              lable={t("Breast")}
              id="breast"
              name="breast"
              onChange={handleChange}
              value={payload?.breast}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
            <Input
              type="text"
              className="form-control"
              placeholder=""
              lable={t("P/A")}
              id="pa"
              name="pa"
              onChange={handleChange}
              value={payload?.pa}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
          </div>
          <Heading title={t("P/S")} isBreadcrumb={false} />
          <div className="row p-2">
            {" "}
            <Input
              type="text"
              className="form-control"
              placeholder=""
              lable={t("Cervix")}
              id="cervix"
              name="cervix"
              onChange={handleChange}
              value={payload?.cervix}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
            <Input
              type="text"
              className="form-control"
              placeholder=""
              lable={t("Vagina")}
              id="vaginal"
              name="vaginal"
              onChange={handleChange}
              value={payload?.vaginal}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
            <Input
              type="text"
              className="form-control"
              placeholder=""
              lable={t("Discharge")}
              id="discharge"
              name="discharge"
              onChange={handleChange}
              value={payload?.discharge}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
          </div>
          <Heading title={t("P/V")} isBreadcrumb={false} />
          <div className="row p-2">
            <ReactSelect
              placeholderName={t("Uterus")}
              id="uterus"
              name="uterus"
              searchable={true}
              onChange={handleChange}
              value={payload?.uterus}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
              removeIsClearable={true}
              dynamicOptions={uterusOptions}
              handleChange={handleSelect}
            />
            <Input
              type="text"
              className="form-control"
              placeholder=""
              lable={t("Size")}
              id="size"
              name="size"
              value={payload?.size}
              onChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
            <ReactSelect
              placeholderName={t("mobileFixed")}
              id="mobileFixed"
              name="mobileFixed"
              searchable={true}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
              removeIsClearable={true}
              dynamicOptions={mobileFixedOptions}
              value={payload?.mobileFixed}
              handleChange={handleSelect}
            />
            <Input
              type="text"
              className="form-control"
              placeholder=""
              lable={t("Fornices")}
              id="fornices"
              name="fornices"
              value={payload?.fornices}
              onChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
            <ReactSelect
              placeholderName={t("Tenderness")}
              id="tenderness"
              name="tenderness"
              value={payload?.tenderness}
              onChange={handleChange}
              searchable={true}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
              removeIsClearable={true}
              dynamicOptions={yesNoOptions}
              handleChange={handleSelect}
            />
            <Input
              type="text"
              className="form-control"
              placeholder=""
              lable={t("P/R")}
              id="pr"
              name="pr"
              value={payload?.pr}
              onChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
            <TextAreaInput
              type="text"
              placeholder=""
              lable={t("Provisional Diagnosis")}
              id="provisionalDiagnosis"
              name="provisionalDiagnosis"
              value={payload?.provisionalDiagnosis}
              onChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
          </div>
          <div className="d-flex justify-content-end gap-2 p-2">
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
            tbody={tableData.map((item, index) => ({
              Sno: index + 1,
              Height: item?.Height,
              Weight: item?.Weight,
              Breast: item?.Breast,
              PA: item?.PA,
              "Provisional Diagnosis": item?.ProvisionalDiagnosis,
              CreatedBy: item?.EnterBy,
              CreatedDatetime: item?.EnterDatetime,
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

export default PhysicalAndSystemicExamination;
