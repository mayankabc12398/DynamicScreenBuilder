import moment from "moment/moment";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  bindDetails_IVFOvum_Pickup,
  bindDoctor_IVFOvum_Pickup,
  print_IVFOvum_Pickup,
  PrintblankPrint_Previous_Infertility,
  save_IVFOvum_Pickup,
} from "../../../networkServices/IVFApi";
import { RedirectURL } from "../../../networkServices/PDFURL";
import Heading from "../../UI/Heading";
import TextAreaInput from "../../formComponent/TextAreaInput";
import ReactSelect from "../../formComponent/ReactSelect";
import Input from "../../formComponent/Input";
import DatePicker from "../../formComponent/DatePicker";
import TimePicker from "../../formComponent/TimePicker";
import Tables from "../../UI/customTable";
import { notify } from "../../../utils/utils";

const OvumPickup = (data) => {
  const [t] = useTranslation();
  const { TransactionID: transactionID, PatientID: patientID } =
    data?.patientDetail || {};
  const { VITE_DATE_FORMAT } = import.meta.env;

  const THEAD = [
    { name: t("SNo") },
    { name: t("Operation Title") },
    { name: t("Procedure Alternative") },
    { name: t("No Treatment") },
    { name: t("Doctor") },
    { name: t("Complication if any") },
    { name: t("SurgeonName") },
    { name: t("AnestheticName") },
    { name: t("Language") },
    { name: t("InterPreter") },
    { name: t("Edit") },
    { name: t("Print") },
  ];

  const [payload, setPayload] = useState({
    transactionID: "",
    patientID: "",
    operationTitle: "",
    procedureAlternative: "",
    noTreatment: "",
    doctor: "",
    complicationifany: "",
    surgeronName: "",
    anestheticName: "",
    language: "",
    interpreter: "",
    witness1Name: "",
    witness1Address: "",
    witness1rltnwithpatient: "",
    witness1Date: new Date(),
    witness1Age: "",
    witness1Time: "",
    witness2Name: "",
    witness2Address: "",
    witness2rltnwithpatient: "",
    witness2Date: new Date(),
    witness2Age: "",
    witness2Time: "",
    id: "",
  });
  const [isEdit, setIsEdit] = useState(false);
  const [tableData, setTableData] = useState([]);
  const [doctorOptions, setDoctorOptions] = useState([]);
  const handleSelect = (name, value) => {
    setPayload((prev) => ({
      ...prev,
      [name]: value?.value || "",
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
      const response = await bindDetails_IVFOvum_Pickup(transactionID);
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
      const response = await print_IVFOvum_Pickup(transactionID, item?.ID);
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
      operationTitle: payload?.operationTitle || "",
      procedureAlternative: payload?.procedureAlternative || "",
      noTreatment: payload?.noTreatment || "",
      doctor: payload?.doctor || "",
      complicationifany: payload?.complicationifany || "",
      surgeronName: payload?.surgeronName || "",
      anestheticName: payload?.anestheticName || "",
      language: payload?.language || "",
      interpreter: payload?.interpreter || "",
      witness1Name: payload?.witness1Name || "",
      witness1Address: payload?.witness1Address || "",
      witness1rltnwithpatient: payload?.witness1rltnwithpatient || "",
      witness1Date: payload?.witness1Date
        ? moment(payload?.witness1Date).format("YYYY-MM-DD")
        : "",
      witness1Age: payload?.witness1Age || "",
      witness1Time: payload?.witness1Time
        ? moment(payload.witness1Time).format("hh:mm A")
        : null,
      witness2Name: payload?.witness2Name || "",
      witness2Address: payload?.witness2Address || "",
      witness2rltnwithpatient: payload?.witness2rltnwithpatient || "",
      witness2Date: payload?.witness2Date
        ? moment(payload?.witness2Date).format("YYYY-MM-DD")
        : "",
      witness2Age: payload?.witness2Age || "",
      witness2Time: payload?.witness2Time
        ? moment(payload?.witness2Time).format("hh:mm A")
        : null,
    };
    try {
      const response = await save_IVFOvum_Pickup(finalPayload);
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
      operationTitle: "",
      procedureAlternative: "",
      noTreatment: "",
      doctor: "",
      complicationifany: "",
      surgeronName: "",
      anestheticName: "",
      language: "",
      interpreter: "",
      witness1Name: "",
      witness1Address: "",
      witness1rltnwithpatient: "",
      witness1Date: new Date(),
      witness1Age: "",
      witness1Time: "",
      witness2Name: "",
      witness2Address: "",
      witness2rltnwithpatient: "",
      witness2Date: new Date(),
      witness2Age: "",
      witness2Time: "",
      id: "",
    });
  };
  const getDoctorNameById = (doctorId) => {
    const doctor = doctorOptions.find(
      (doc) => String(doc.value) === String(doctorId),
    );
    return doctor ? doctor.label : doctorId;
  };

  const handleEdit = (item) => {
    setPayload({
      id: item?.ID || "",
      patientID,
      transactionID,

      operationTitle: item?.OperationTitle || "",
      procedureAlternative: item?.ProcedureAlternative || "",
      noTreatment: item?.NoTreatment || "",
      doctor: item?.DoctorName || "",
      complicationifany: item?.ComplicationIFAny || "",
      surgeronName: item?.SurgeonName || "",
      anestheticName: item?.AnestheticName || "",
      language: item?.LANGUAGE || "",
      interpreter: item?.Interpreter || "",

      witness1Name: item?.Witness1_Name || "",
      witness1Address: item?.Witness1_Address || "",
      witness1rltnwithpatient: item?.Witness1_RelationwithPatient || "",
      witness1Date: item?.Witness1_Date
        ? moment(item.Witness1_Date, "DD-MMM-YYYY").toDate()
        : null,
      witness1Age: item?.Witness1_Age || "",
      witness1Time: item?.Witness1_time
        ? moment(item.Witness1_time, "hh:mm A").toDate()
        : "",

      witness2Name: item?.Witness2_Name || "",
      witness2Address: item?.Witness2_Address || "",
      witness2rltnwithpatient: item?.Witness2_RelationwithPatient || "",
      witness2Date: item?.Witness2_Date
        ? moment(item.Witness2_Date, "DD-MMM-YYYY").toDate()
        : null,
      witness2Age: item?.Witness2_Age || "",
      witness2Time: item?.Witness2_time
        ? moment(item.Witness2_time, "hh:mm A").toDate()
        : "",
    });

    setIsEdit(true);
  };

  const fetchDoctorList = async () => {
    try {
      const res = await bindDoctor_IVFOvum_Pickup();
      if (res?.success) {
        const options = res.data.map((item) => ({
          label: item?.DoctorName,
          value: item?.DoctorID,
        }));
        setDoctorOptions(options);
      } else {
        setDoctorOptions([]);
        notify(res?.message, "error");
      }
    } catch (error) {
      notify(t("Doctor list error"), "error");
    }
  };
  useEffect(() => {
    fetchDoctorList();
  }, []);
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
              lable={t("Operation Title")}
              id="operationTitle"
              name="operationTitle"
              value={payload?.operationTitle}
              onChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
            <TextAreaInput
              type="text"
              placeholder=""
              lable={t("Procedure Alternative")}
              id="procedureAlternative"
              name="procedureAlternative"
              value={payload?.procedureAlternative}
              onChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
            <TextAreaInput
              type="text"
              placeholder=""
              lable={t("No Treatment")}
              id="noTreatment"
              name="noTreatment"
              value={payload?.noTreatment}
              onChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
            <ReactSelect
              placeholderName={t("Doctor")}
              id="doctor"
              name="doctor"
              searchable={true}
              onChange={handleChange}
              value={payload?.doctor}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
              removeIsClearable={true}
              dynamicOptions={doctorOptions}
              handleChange={handleSelect}
            />
            <TextAreaInput
              type="text"
              placeholder=""
              lable={t("Complication if any")}
              id="complicationifany"
              name="complicationifany"
              value={payload?.complicationifany}
              onChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
            <ReactSelect
              placeholderName={t("Surgeon Name")}
              id="surgeronName"
              name="surgeronName"
              searchable={true}
              onChange={handleChange}
              value={payload?.surgeronName}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
              removeIsClearable={true}
              dynamicOptions={doctorOptions}
              handleChange={handleSelect}
            />
            <ReactSelect
              placeholderName={t("Anesthetic Name")}
              id="anestheticName"
              name="anestheticName"
              searchable={true}
              onChange={handleChange}
              value={payload?.anestheticName}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
              removeIsClearable={true}
              dynamicOptions={doctorOptions}
              handleChange={handleSelect}
            />
            <Input
              type="text"
              className="form-control"
              placeholder=""
              lable={t("Language")}
              id="language"
              name="language"
              value={payload?.language}
              onChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
            <Input
              type="text"
              className="form-control"
              placeholder=""
              lable={t("Interpreter")}
              id="interpreter"
              name="interpreter"
              value={payload?.interpreter}
              onChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
            <Input
              type="text"
              className="form-control"
              placeholder=""
              lable={t("Name")}
              id="witness1Name"
              name="witness1Name"
              value={payload?.witness1Name}
              onChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
            <Input
              type="text"
              className="form-control"
              placeholder=""
              lable={t("Address")}
              id="witness1Address"
              name="witness1Address"
              value={payload?.witness1Address}
              onChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
            <Input
              type="text"
              className="form-control"
              placeholder=""
              lable={t("Relation with Patient")}
              id="witness1rltnwithpatient"
              name="witness1rltnwithpatient"
              value={payload?.witness1rltnwithpatient}
              onChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
            <DatePicker
              placeholder={VITE_DATE_FORMAT}
              className="custom-calendar"
              lable={t("Date")}
              name="witness1Date"
              id="witness1Date"
              value={payload?.witness1Date}
              showTime
              hourFormat="12"
              handleChange={handleChange}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            />
            <Input
              type="text"
              className="form-control"
              placeholder=""
              lable={t("Age")}
              id="witness1Age"
              name="witness1Age"
              value={payload?.witness1Age}
              onChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
            <TimePicker
              placeholderName={t("Time")}
              id="witness1Time"
              name="witness1Time"
              value={payload?.witness1Time}
              handleChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
            <Input
              type="text"
              className="form-control"
              placeholder=""
              lable={t("Name")}
              id="witness2Name"
              name="witness2Name"
              value={payload?.witness2Name}
              onChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />{" "}
            <Input
              type="text"
              className="form-control"
              placeholder=""
              lable={t("Address")}
              id="witness2Address"
              name="witness2Address"
              value={payload?.witness2Address}
              onChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
            <Input
              type="text"
              className="form-control"
              placeholder=""
              lable={t("Relation with Patient")}
              id="witness2rltnwithpatient"
              name="witness2rltnwithpatient"
              value={payload?.witness2rltnwithpatient}
              onChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
            <DatePicker
              placeholder={VITE_DATE_FORMAT}
              className="custom-calendar"
              lable={t("Date")}
              name="witness2Date"
              id="witness2Date"
              value={payload?.witness2Date}
              showTime
              hourFormat="12"
              handleChange={handleChange}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            />
            <Input
              type="text"
              className="form-control"
              placeholder=""
              lable={t("Age")}
              id="witness2Age"
              name="witness2Age"
              value={payload?.witness2Age}
              onChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
            <TimePicker
              placeholder=""
              placeholderName={t("Time")}
              id="witness2Time"
              name="witness2Time"
              value={payload?.witness2Time}
              handleChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
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
          <Heading title={t("Entry List")} />
          <Tables
            thead={THEAD}
            tbody={tableData?.map((item, index) => ({
              SNo: index + 1,
              "Operation Title": item?.OperationTitle || "",
              "Procedure Alternative": item?.ProcedureAlternative || "",
              "No Treatment": item?.NoTreatment || "",
              Doctor: getDoctorNameById(item?.DoctorName) || "",
              "Complication if any": item?.ComplicationIFAny || "",
              SurgeonName: getDoctorNameById(item?.SurgeonName) || "",
              AnestheticName: getDoctorNameById(item?.AnestheticName) || "",
              Language: item?.LANGUAGE || "",
              InterPreter: item?.Interpreter || "",
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
export default OvumPickup;
