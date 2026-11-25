import moment from "moment/moment";
import { useEffect, useState } from "react";
import {
  bindDetails_ANCPatientHistory1Api,
  bindDoctorPAApi,
  bindDoctorPMApi,
  blankPrint_ANCPatientHistoryI,
  print_ANCPatientHistoryI,
  save_ANCPatientHistoryIApi,
} from "../../networkServices/IVFApi";
import { RedirectURL } from "../../networkServices/PDFURL";
import { notify } from "../../utils/utils";
import DatePicker from "../formComponent/DatePicker";
import Heading from "../UI/Heading";
import ReactSelect from "../formComponent/ReactSelect";
import Tables from "../UI/customTable";
import Input from "../formComponent/Input";
import { useTranslation } from "react-i18next";

const ANCPatientHistoryI = ({ data }) => {
  const { VITE_DATE_FORMAT } = import.meta.env;
  const [t] = useTranslation();
  const { TransactionID: transactionID, PatientID: patientID } =
    data ?? data?.patientDetail ?? {};
  console.log("datadatadata", data);
  const [payload, setPayload] = useState({
    // transactionID: "",
    // patientID: "",
    ivfID: "",
    lmp: new Date(),
    lengthofcycle: "",
    duration: "",
    intensity: "",
    dysmenorrhoea: "",
    gravida: "",
    parity: "",
    noofLiveissue: "",
    noofabortions: "",
    caseof: "",
    doa: new Date(),
    mop: "",
    roa: "",
    dc: "",
    pA_HospName: "",
    pA_DocName: "",
    pA_Remarks_Indication: "",
    pM_Remarks_Indication: "",
    deliverydate: new Date(),
    gestationalAge: "",
    typeofdelivery: "",
    gender: "",
    pM_HospName: "",
    pM_DocName: "",
    pM_Remarks_Indication: "",
    id: "",
    inYears: "",
  });

  const THEAD = [
    { name: t("SNo"), width: "1%" },
    { name: t("LMP") },
    {
      name: (
        <>
          {t("Length of")} <br />
          {t("Cycle")}
        </>
      ),
      width: "2%",
    },
    { name: t("Duration") },
    { name: t("Gravida") },
    { name: t("Parity") },
    {
      name: (
        <>
          {t("No of")} <br />
          {t("Live issue")}
        </>
      ),
    },
    { name: t("No of abortions") },
    { name: t("case of") },
    { name: t("Date of abortion") },
    { name: t("Month of pregnancy") },
    { name: t("Reason for Abortion") },
    { name: t("D&C") },
    { name: t("Edit") },
    { name: t("Print") },
  ];

  const [tableData, setTableData] = useState([]);
  const [isEdit, setIsEdit] = useState(false);
  const [doctorOptions, setDoctorOptions] = useState([]);
  const [doctorPAOptions, setPADoctorOptions] = useState([]);
 const getDoctorNameById = (doctorId) => {
    const doctor = doctorOptions.find(
      (doc) => String(doc.value) === String(doctorId),
    );
    return doctor ? doctor.label : doctorId;
  };
  const handleSave = async () => {
    const finalPayload = {
      transactionID: data?.transactionID ?? "",
      patientID: data?.transactionID ?? "",
      ivfID: payload?.ivfID,
      id: payload.id || "0",

      lmp: payload.lmp ? moment(payload.lmp).format("YYYY-MM-DD") : "",
      lengthofcycle: payload.lengthofcycle,
      duration: payload.duration,
      intensity: payload.intensity,
      dysmenorrhoea: payload.dysmenorrhoea,

      gravida: payload.gravida,
      parity: payload.parity,
      noofLiveissue: payload.noofLiveissue,
      noofabortions: payload.noofabortions,
      caseof: payload.caseof,

      doa: payload.doa ? moment(payload.doa).format("YYYY-MM-DD") : "",
      mop: payload.mop,
      roa: payload.roa,
      dc: payload.dc,

      pA_HospName: payload.pA_HospName,
      pA_DocName: getDoctorNameById(payload.pA_DocName),
      pA_Remarks_Indication: payload.pA_Remarks_Indication,

      deliverydate: payload.deliverydate
        ? moment(payload.deliverydate).format("YYYY-MM-DD")
        : "",
      gestationalAge: payload.gestationalAge,
      typeofdelivery: payload.typeofdelivery,
      gender: payload.gender,

      pM_HospName: payload.pM_HospName,
      pM_DocName: getDoctorNameById(payload.pM_DocName),
      pM_Remarks_Indication: payload.pM_Remarks_Indication,

      inYears: payload.inYears,
    };

    try {
      const response = await save_ANCPatientHistoryIApi(finalPayload);

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
    }
  };

  const resetForm = () => {
    setPayload((prev) => ({
      ...prev,

      lmp: "",
      lengthofcycle: "",
      duration: "",
      intensity: "",
      dysmenorrhoea: "",
      gravida: "",
      parity: "",
      noofLiveissue: "",
      noofabortions: "",
      caseof: "",
      doa: "",
      mop: "",
      roa: "",
      dc: "",
      pA_HospName: "",
      pA_DocName: "",
      pA_Remarks_Indication: "",
      deliverydate: null,
      gestationalAge: "",
      typeofdelivery: "",
      gender: "",
      pM_HospName: "",
      pM_DocName: "",
      pM_Remarks_Indication: "",
      id: "",
      inYears: "",
    }));
  };

  const fetchData = async () => {
    try {
      const res = await bindDetails_ANCPatientHistory1Api(data?.transactionID);

      if (res?.success) {
        setTableData(res?.data || []);
      } else {
        setTableData([]);
        console.log("setTableData");
        notify(res?.message || "Failed to fetch data", "error");
      }
    } catch (error) {
      setTableData([]);
      notify(t("Fetch data error"), "error");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);
  const fetchDoctorList = async () => {
    try {
      const res = await bindDoctorPAApi();
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

  const fetchPADoctorList = async () => {
    try {
      const res = await bindDoctorPMApi();
      if (res?.success) {
        const options = res.data.map((item) => ({
          label: item?.DoctorName,
          value: item?.DoctorID,
        }));
        setPADoctorOptions(options);
      } else {
        setPADoctorOptions([]);
        notify(res?.message, "error");
      }
    } catch (error) {
      notify(t("Doctor list error"), "error");
    }
  };

  useEffect(() => {
    fetchPADoctorList();
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
      const response = await blankPrint_ANCPatientHistoryI(1);

      if (response?.success) {
        RedirectURL(response?.data?.pdfUrl);
      }
    } catch (error) {
      notify(error?.message || "Print error", "error");
    }
  };

  const handleRowPrint = async (item) => {
    try {
      const response = await print_ANCPatientHistoryI(data?.transactionID, item?.ID);
      if (response?.success) {
        RedirectURL(response?.data?.pdfUrl);
      }
    } catch (error) {
      notify(error?.message || "Print error", "error");
    }
  };

  const handleEdit = (item) => {
    setPayload({
      // transactionID: data?.transactionID,
      // patientID: patientID,
      ivfID: item?.IVFID || "",

      lmp: item?.LMP ? moment(item.LMP, "DD-MMM-YYYY").toDate() : "",
      lengthofcycle: item?.lengthofcycle || "",
      duration: item?.Duration || "",
      intensity: item?.Intensity || "",
      dysmenorrhoea: item?.Dysmenorrhoea || "",

      gravida: item?.Gravida || "",
      parity: item?.Parity || "",
      noofLiveissue: item?.NoofLiveissue || "",
      noofabortions: item?.Noofabortions || "",
      caseof: item?.Caseof || "",

      doa: item?.DOA ? moment(item.DOA, "DD-MMM-YYYY").toDate() : "",
      mop: item?.MOP || "",
      roa: item?.ROA || "",
      dc: item?.DC || "",

      pA_HospName: item?.PA_HospName || "",
      pA_DocName: item?.PA_DocName || "",
      pA_Remarks_Indication: item?.PA_Remarks_Indication || "",

      deliverydate: item?.Deliverydate
        ? moment(item.Deliverydate, "DD-MMM-YYYY").toDate()
        : "",
      gestationalAge: item?.GestationalAge || "",
      typeofdelivery: item?.Typeofdelivery || "",
      gender: item?.Gender || "",

      pM_HospName: item?.PM_HospName || "",
      pM_DocName: item?.PM_DocName || "",
      pM_Remarks_Indication: item?.PM_Remarks_Indication || "",

      inYears: item?.InYears || "",
      id: item?.ID?.toString(),
    });

    setIsEdit(true);
  };

  return (
    <>
      <div className="patient_registration card mt-2">
        <Heading title={t("Manstual Cycle History")} />

        <div className="row p-2">
          <DatePicker
            placeholder={VITE_DATE_FORMAT}
            className="custom-calendar"
            lable={t("LMP")}
            name="lmp"
            id="lmp"
            value={payload?.lmp}
            showTime
            hourFormat="12"
            handleChange={handleChange}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
          />

          <Input
            type="text"
            id="lengthofcycle"
            name="lengthofcycle"
            placeholder=""
            lable={t("Length of Cycle")}
            value={payload.lengthofcycle}
            onChange={handleChange}
            className="form-control"
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
          />

          <Input
            type="text"
            id="duration"
            name="duration"
            placeholder=""
            lable={t("Duration")}
            value={payload.duration}
            onChange={handleChange}
            className="form-control"
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
          />

          <Input
            type="text"
            id="intensity"
            name="intensity"
            placeholder=""
            lable={t("Intensity")}
            value={payload.intensity}
            onChange={handleChange}
            className="form-control"
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
          />

          <Input
            type="text"
            id="dysmenorrhoea"
            name="dysmenorrhoea"
            placeholder=""
            lable={t("Dysmenorrhoea")}
            value={payload.dysmenorrhoea}
            onChange={handleChange}
            className="form-control"
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
          />
        </div>
        <Heading title={t("GPLA")} />
        <div className="row p-2">
          <Input
            type="text"
            id="gravida"
            name="gravida"
            placeholder=""
            lable={t("Gravida")}
            value={payload?.gravida}
            onChange={handleChange}
            className="form-control"
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
          />

          <Input
            type="text"
            id="parity"
            name="parity"
            placeholder=""
            lable={t("Parity")}
            value={payload?.parity}
            onChange={handleChange}
            className="form-control"
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
          />
          <Input
            type="text"
            id="noofLiveissue"
            name="noofLiveissue"
            placeholder=""
            lable={t("No of Liveissue")}
            value={payload?.noofLiveissue}
            onChange={handleChange}
            className="form-control"
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
          />
          <Input
            type="text"
            id="noofabortions"
            name="noofabortions"
            placeholder=""
            lable={t("No of abortions")}
            value={payload?.noofabortions}
            onChange={handleChange}
            className="form-control"
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
          />
          <Input
            type="text"
            id="caseof"
            name="caseof"
            placeholder=""
            lable={t("Case of")}
            value={payload?.caseof}
            onChange={handleChange}
            className="form-control"
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
          />
        </div>
        <Heading title={t("Abortion History")} />
        <div className="row p-2">
          <DatePicker
            placeholder={VITE_DATE_FORMAT}
            className="custom-calendar"
            lable={t("Date of abortion")}
            name="doa"
            id="doa"
            value={payload?.doa}
            showTime
            hourFormat="12"
            handleChange={handleChange}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
          />

          <Input
            type="text"
            name="mop"
            id="mop"
            placeholder=""
            lable={t("Month of pregnancy")}
            value={payload.mop}
            onChange={handleChange}
            className="form-control"
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
          />
          <Input
            type="text"
            name="roa"
            id="roa"
            placeholder=""
            lable={t("Reason for Abortion")}
            value={payload?.roa}
            onChange={handleChange}
            className="form-control"
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
          />
          <Input
            type="text"
            name="dc"
            id="dc"
            placeholder=""
            lable={t("D&C")}
            value={payload?.dc}
            onChange={handleChange}
            className="form-control"
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
          />
          <Input
            type="text"
            name="pA_HospName"
            id="pA_HospName"
            placeholder=""
            lable={t("Hospital Name")}
            value={payload?.pA_HospName}
            onChange={handleChange}
            className="form-control"
            respclass="col-xl-2 col-md-2 col-sm-4 col-12"
          />

          <ReactSelect
            placeholderName={t("Dr's Name")}
            id="pA_DocName"
            name="pA_DocName"
            searchable={true}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            removeIsClearable={true}
            dynamicOptions={doctorOptions}
            value={payload?.pA_DocName}
            handleChange={handleSelect}
          />
          <Input
            type="text"
            name="pA_Remarks_Indication"
            id="pA_Remarks_Indication"
            placeholder=""
            lable={t("Remarks/Indication")}
            onChange={handleChange}
            className="form-control"
            respclass="col-xl-2 col-md-6 col-sm-4 col-12"
            value={payload?.pA_Remarks_Indication}
          />
        </div>

        <Heading title={t("Pregnancy more than 28 weeks")} />
        <div className="row p-2">
          <DatePicker
            placeholder={VITE_DATE_FORMAT}
            className="custom-calendar"
            name="deliverydate"
            id="deliverydate"
            showTime
            hoursFormate="12"
            lable={t("Delivery Date")}
            value={payload.deliverydate}
            handleChange={handleChange}
            respclass="col-xl col-md-3 col-sm-4 col-12"
          />
          <Input
            type="text"
            name="gestationalAge"
            id="gestationalAge"
            placeholder=""
            lable={t("Gestational Age")}
            onChange={handleChange}
            className="form-control"
            respclass="col-xl col-md-3 col-sm-4 col-12"
            value={payload?.gestationalAge}
          />
          <Input
            type="text"
            name="typeofdelivery"
            id="typeofdelivery"
            placeholder=""
            lable={t("Type of Delivery")}
            onChange={handleChange}
            className="form-control"
            respclass="col-xl col-md-3 col-sm-4 col-12"
            value={payload?.typeofdelivery}
          />
          <Input
            type="text"
            name="gender"
            id="gender"
            placeholder=""
            lable={t("Gender")}
            onChange={handleChange}
            className="form-control"
            respclass="col-xl col-md-3 col-sm-4 col-12"
            value={payload?.gender}
          />
          <Input
            type="text"
            name="pM_HospName"
            id="pM_HospName"
            placeholder=""
            lable={t("Hospital Name")}
            onChange={handleChange}
            className="form-control"
            respclass="col-xl col-md-3 col-sm-4 col-12"
            value={payload?.pM_HospName}
          />
          <ReactSelect
            placeholderName={t("Dr's Name")}
            id="pM_DocName"
            name="pM_DocName"
            searchable={true}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            removeIsClearable={true}
            dynamicOptions={doctorPAOptions}
            value={payload?.pM_DocName}
            handleChange={handleSelect}
          />
          <Input
            type="text"
            name="pM_Remarks_Indication"
            id="pM_Remarks_Indication"
            placeholder=""
            lable={t("Remarks/Indication")}
            onChange={handleChange}
            className="form-control"
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            value={payload?.pM_Remarks_Indication}
          />
        </div>
      </div>
      <div className="d-flex justify-content-end gap-2 mt-3 mb-3">
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
      {tableData && tableData.length > 0 && (
        <>
          <div className="patient_registration card mt-2"></div>
          <Heading title={t("History Details")} />
          <Tables
            thead={THEAD}
            tbody={tableData.map((item, index) => ({
              SNo: index + 1,
              LMP: item?.LMP,
              "Length of Cycle": item?.lengthofcycle,
              Duration: item?.Duration,
              Gravida: item?.Gravida,
              Parity: item?.Parity,
              "No of Live issue": item?.NoofLiveissue,
              "No of abortions": item?.Noofabortions,
              "case of": item?.Caseof,
              "Date of abortion": item?.DOA,
              "Month of pregnancy": item?.MOP,
              "Reason for Abortion": item?.ROA,
              "D&C": item?.DC,

              Edit: (
                <i
                  className="fa fa-edit p-1"
                  onClick={() => handleEdit(item)}
                  style={{ cursor: "pointer", color: "blue" }}
                />
              ),
              Print: (
                <i
                  className="fa fa-print p-1"
                  onClick={() => handleRowPrint(item)}
                  style={{ cursor: "pointer", color: "green" }}
                />
              ),
            }))}
          />
        </>
      )}
    </>
  );
};
export default ANCPatientHistoryI;
