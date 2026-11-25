import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import {
  bindDetails_General_ExaminationApi,
  blankPrint_General_ExaminationApi,
  print_General_ExaminationApi,
  save_General_ExaminationApi,
} from "../../../networkServices/IVFApi";
import Input from "../../formComponent/Input";
import Heading from "../../UI/Heading";
import Tables from "../../UI/customTable";
import { notify } from "../../../utils/utils";
import { RedirectURL } from "../../../networkServices/PDFURL";

const AncGeneralExamination = (data) => {
  const [t] = useTranslation();
  const { TransactionID: transactionID, PatientID: patientID } =
    data?.patientDetail || {};
  const { VITE_DATE_FORMAT } = import.meta.env;

  const THEAD = [
    { name: t("SNo") },
    { name: t("Height") },
    { name: t("Weight") },
    { name: t("Breast Secretion") },
    { name: t("Abnormal Hair") },
    { name: t("B.P") },
    { name: t("Pelvic Examination") },
    { name: t("Basal TVSR") },
    { name: t("BMI") },
    { name: t("Edit") },
    { name: t("Print") },
  ];

  const [payload, setPayload] = useState({
    transactionID: "",
    patientID: "",
    ivfID: "",
    height: "",
    weight: "",
    breastSecretion: "",
    abnormalHair: "",
    bp: "",
    pelvicExamination: "",
    basalTVSR: "",
    bmi: "",
    id: "",
  });
  const [isEdit, setIsEdit] = useState(false);
  const [tableData, setTableData] = useState([]);
  const [doctorOptions, setDoctorOptions] = useState([]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPayload((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  const fetchData = async () => {
    try {
      const response = await bindDetails_General_ExaminationApi(transactionID);
      if (response?.success) {
        setTableData(response.data || []);
      } else {
        notify(response?.message, "error");
      }
    } catch (error) {
      notify(response?.message, "error");
      console.error(error);
    }
  };
  useEffect(() => {
    fetchData();
  }, []);
  const hanldleprint = async () => {
    try {
      const response = await blankPrint_General_ExaminationApi(1);

      if (response?.success) {
        RedirectURL(response?.data?.pdfUrl);
      }
    } catch (error) {
      notify(error?.message || "Print error", "error");
    }
  };
  const handleRowPrint = async (item) => {
    try {
      const response = await print_General_ExaminationApi(
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
      transactionID,
      patientID,
      ivfID: payload.ivfID || "",
      height: payload.height || "",
      weight: payload.weight || "",
      breastSecretion: payload.breastSecretion || "",
      abnormalHair: payload.abnormalHair || "",
      bp: payload.bp || "",
      pelvicExamination: payload.pelvicExamination || "",
      basalTVSR: payload.basalTVSR || "",
      bmi: payload.bmi || "",
    };

    try {
      const response = await save_General_ExaminationApi(finalPayload);

      if (response?.success) {
        notify(response?.message || "Saved successfully", "success");
        fetchData();
        resetForm();
        setIsEdit(false);
      } else {
        notify(response?.message, "error");
      }
    } catch (error) {
      notify(error?.response?.data?.message, "error");
    }
  };

  const resetForm = () => {
    setPayload({
      transactionID: "",
      patientID: "",
      ivfID: "",
      height: "",
      weight: "",
      breastSecretion: "",
      abnormalHair: "",
      bp: "",
      pelvicExamination: "",
      basalTVSR: "",
      bmi: "",
      id: "",
    });
  };

  const handleEdit = (item) => {
    setPayload({
      id: item?.ID || "",
      transactionID,
      patientID,
      ivfID: item?.IVFID || "",
      height: item?.Height || "",
      weight: item?.Weight || "",
      breastSecretion: item?.BreastSecretion || "",
      abnormalHair: item?.AbnormalHair || "",
      bp: item?.BP || "",
      pelvicExamination: item?.PelvicExamination || "",
      basalTVSR: item?.BasalTVSR || "",
      bmi: item?.BMI || "",
    });

    setIsEdit(true);
  };

  return (
    <>
      <div className="patient_registration card mt-2">
        <Heading title={t("Previous Infertility Previous History")} />
        <div className="row p-2">
          <Input
            type="text"
            className="form-control"
            placeholder=""
            lable={t("Height")}
            id="height"
            name="height"
            value={payload?.height}
            onChange={handleChange}
            respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
          />
          <Input
            type="text"
            className="form-control"
            placeholder=""
            lable={t("Weight")}
            id="weight"
            name="weight"
            value={payload?.weight}
            onChange={handleChange}
            respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
          />
          <Input
            type="text"
            className="form-control"
            placeholder=""
            lable={t("Breast Secretion")}
            id="breastSecretion"
            name="breastSecretion"
            value={payload?.breastSecretion}
            onChange={handleChange}
            respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
          />
          <Input
            type="text"
            className="form-control"
            placeholder=""
            lable={t("Abnormal Hair")}
            id="abnormalHair"
            name="abnormalHair"
            value={payload?.abnormalHair}
            onChange={handleChange}
            respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
          />{" "}
          <Input
            type="text"
            className="form-control"
            placeholder=""
            lable={t("B.P")}
            id="bp"
            name="bp"
            value={payload?.bp}
            onChange={handleChange}
            respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
          />{" "}
          <Input
            type="text"
            className="form-control"
            placeholder=""
            lable={t("Pelvic Examination")}
            id="pelvicExamination"
            name="pelvicExamination"
            value={payload?.pelvicExamination}
            onChange={handleChange}
            respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
          />
          <Input
            type="text"
            className="form-control"
            placeholder=""
            lable={t("Basal TVSR")}
            id="basalTVSR"
            name="basalTVSR"
            value={payload?.basalTVSR}
            onChange={handleChange}
            respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
          />
          <Input
            type="text"
            className="form-control"
            placeholder=""
            lable={t("BMI")}
            id="bmi"
            name="bmi"
            value={payload?.bmi}
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
      {tableData && tableData.length > 0 && (
        <>
          <div className="patient_registration card mt-2"></div>
          <Heading title={t("History Details")} />
          <Tables
            thead={THEAD}
            tbody={tableData?.map((item, index) => ({
              SNo: index + 1,
              Height: item?.Height || "",
              Weight: item?.Weight || "",
              "Breast Secretion": item?.BreastSecretion || "",
              "Abnormal Hair": item?.AbnormalHair || "",
              "B.P": item?.BP || "",
              "Pelvic Examination": item?.PelvicExamination || "",
              "Basal TVSR": item?.BasalTVSR || "",
              BMI: item?.BMI || "",

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
export default AncGeneralExamination;
