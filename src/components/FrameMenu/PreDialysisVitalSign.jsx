import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Input from "../formComponent/Input";
import ReactSelect from "../formComponent/ReactSelect";
import DatePicker from "../formComponent/DatePicker";
import Heading from "../UI/Heading";
import {
  getHemodialysis_Pre_Dialysis_VitalApi,
  saveHemodialysis_Pre_Dialysis_VitalApi,
  updateHemodialysis_Pre_Dialysis_VitalApi,
} from "../../networkServices/nursingWardAPI";
import { notify } from "../../utils/utils";

const PreDialysisVitalSign = ({ data }) => {
  const { t } = useTranslation();
  const { VITE_DATE_FORMAT } = import.meta.env;
  const { transactionID, patientID } = data;
  const [initialState, setInitialState] = useState({
    id: 0,
    patientId: "",
    transactionId: "",
    previousWeight: "",
    currentWeight: "",
    weightGain: "",
    dryWeight: "",
    bloodGroup: "",
    hivTest: "",
    hepatitisBSurfaceAg: "",
    heapatitisCAntiBody: "",
    bp: "",
    pulse: "",
    resp: "",
    spo2: "",
    temp: "",
    rbs: "",
    hcv: "",
    angio: "",
    dateofFixed: new Date(),
    screeingDate1: new Date(),
    screeingDate2: new Date(),
    screeingDate3: new Date(),
    dateDone: new Date(),
    currentHB: "",
    diagnosis: "",
  });
  const parseDate = (dateStr) => (dateStr ? new Date(dateStr) : null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInitialState((prev) => ({ ...prev, [name]: value }));
  };
  const handleSelect = (name, selectedOption) => {
    setInitialState((prev) => ({
      ...prev,
      [name]: selectedOption?.value || "",
    }));
  };
  const [isSaved, setIsSaved] = useState(false);

  const hivTestOptions = [
    { label: t("Positive"), value: "Positive" },
    { label: t("Negative"), value: "Negative" },
    { label: t("Not Test"), value: "Not Test" },
  ];
  const hepatitisSurface = [
    { label: t("Positive"), value: "Positive" },
    { label: t("Negative"), value: "Negative" },
  ];

  const fetchList = async () => {
    try {
      const res = await getHemodialysis_Pre_Dialysis_VitalApi(
        transactionID,
        patientID
      );

      if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
        const d = res.data[0];

        setInitialState({
          id: d.Id || 0,
          transactionId: d.TransactionId || "",
          patientId: d.PatientId || "",

          previousWeight: d.PreviousWeight || "",
          currentWeight: d.CurrentWeight || "",
          weightGain: d.WeightGain || "",
          dryWeight: d.DryWeight || "",
          bloodGroup: d.BloodGroup || "",

          hivTest: d.HivTest || "",
          hepatitisBSurfaceAg: d.HepatitisBSurfaceAg || "",
          heapatitisCAntiBody: d.HeapatitisCAntiBody || "",

          bp: d.BP || "",
          pulse: d.Pulse || "",
          resp: d.Resp || "",
          spo2: d.Spo2 || "",
          temp: d.Temp || "",
          rbs: d.RBS || "",
          hcv: d.HCV || "",

          screeingDate1: parseDate(d.ScreeingDate1),
          screeingDate2: parseDate(d.ScreeingDate2),
          screeingDate3: parseDate(d.ScreeingDate3),
          dateDone: parseDate(d.DateDone),
          dateofFixed: parseDate(d.DateofFixed),

          currentHB: d.CurrentHB || "",
          diagnosis: d.Diagnosis || "",
          angio: d.Angio || "",
        });

        setIsSaved(true);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  const handleSaveOrUpdate = async () => {
    const payload = {
      id: initialState.id || 0,
      patientId: patientID || "",
      transactionId: transactionID || "",

      previousWeight: initialState.previousWeight || "",
      currentWeight: initialState.currentWeight || "",
      weightGain: initialState.weightGain || "",
      dryWeight: initialState.dryWeight || "",
      bloodGroup: initialState.bloodGroup || "",

      hivTest: initialState.hivTest || "",
      hepatitisBSurfaceAg: initialState.hepatitisBSurfaceAg || "",
      heapatitisCAntiBody: initialState.heapatitisCAntiBody || "",

      bp: initialState.bp || "",
      pulse: initialState.pulse || "",
      resp: initialState.resp || "",
      spo2: initialState.spo2 || "",
      temp: initialState.temp || "",
      rbs: initialState.rbs || "",
      hcv: initialState.hcv || "",

      angio: initialState.angio || "",

      dateofFixed: initialState.dateofFixed || "",
      screeingDate1: initialState.screeingDate1 || "",
      screeingDate2: initialState.screeingDate2 || "",
      screeingDate3: initialState.screeingDate3 || "",
      dateDone: initialState.dateDone || "",

      currentHB: initialState.currentHB || "",
      diagnosis: initialState.diagnosis || "",
    };

    const apiCall =
      initialState.id || isSaved
        ? updateHemodialysis_Pre_Dialysis_VitalApi
        : saveHemodialysis_Pre_Dialysis_VitalApi;

    try {
      const res = await apiCall(payload);
      if (res?.success) {
        notify(res?.message, "success");
        setIsSaved(true);
        fetchList();
      }
    } catch (error) {
      notify(error?.message, "error");
    }
  };

  return (
    <>
      <div className="mt-2 spatient_registration_card">
        <div className="patient_registration card p-2">
          <div className="row">
            <Input
              type="Number"
              lable={t("Previous Weight")}
              className="form-control"
              name="previousWeight"
              id="previousWeight"
              value={initialState?.previousWeight}
              onChange={handleChange}
              placeholder=""
              placeholderLabel="Kg / g"
              respclass="col-xl-2 col-md-4 col-sm-4 col-12"
            />
            <Input
              type="Number"
              lable={t("Current Weight")}
              className="form-control"
              name="currentWeight"
              id="currentWeight"
              value={initialState?.currentWeight}
              onChange={handleChange}
              placeholder=""
              placeholderLabel="Kg / g"
              respclass="col-xl-2 col-md-4 col-sm-4 col-12"
            />

            <Input
              type="text"
              lable={t("Weight Gain")}
              name="weightGain"
              id="weightGain"
              value={initialState?.weightGain}
              onChange={handleChange}
              placeholder=""
              className="form-control"
              respclass="col-xl-2 col-md-4 col-sm-4 col-12"
              placeholderLabel="kg / g"
            />

            <Input
              type="text"
              lable={t("Dry Weight")}
              className="form-control"
              name="dryWeight"
              id="dryWeight"
              placeholder=""
              value={initialState?.dryWeight}
              onChange={handleChange}
              placeholderLabel="/m"
              respclass="col-xl-2 col-md-4 col-sm-4 col-12"
            />
            <Input
              type="text"
              className="form-control"
              lable={t("Blood Group")}
              name="bloodGroup"
              id="bloodGroup"
              placeholder=""
              value={initialState?.bloodGroup}
              onChange={handleChange}
              respclass="col-xl-2 col-md-4 col-sm-4 col-12"
            />

            <Input
              type="text"
              lable={t("Diagnosis")}
              className="form-control"
              placeholder=""
              name="diagnosis"
              value={initialState?.diagnosis}
              id="diagnosis"
              onChange={handleChange}
              respclass="col-xl-2 col-md-4 col-sm-4 col-12"
            />
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
                {t("PRE-DIALYSIS VITAL SIGN")}
              </label>
              <div className="row">
                <div className="col-xl-2 col-md-4 col-sm-6 col-12">
                  <Input
                    type="text"
                    className="form-control"
                    lable={t("BP")}
                    name="bp"
                    id="bp"
                    placeholder=""
                    value={initialState?.bp}
                    onChange={handleChange}
                    placeholderLabel="mmHg"
                    respclass="row-12"
                  />
                </div>
                <div className="col-xl-2 col-md-4 col-sm-6 col-12 mb-2">
                  <Input
                    type="text"
                    lable={t("Pulse")}
                    className="form-control"
                    name="pulse"
                    id="pulse"
                    placeholder=""
                    value={initialState?.pulse}
                    onChange={handleChange}
                    respclass="row-12"
                    placeholderLabel="b/m"
                  />
                </div>
                <div className="col-xl-2 col-md-4 col-sm-6 col-12 mb-2">
                  <Input
                    type="text"
                    lable={t("Resp")}
                    className="form-control"
                    name="resp"
                    id="resp"
                    placeholder=""
                    value={initialState?.resp}
                    onChange={handleChange}
                    placeholderLabel="/m"
                    respclass="row-12"
                  />
                </div>
                <div className="col-xl-2 col-md-4 col-sm-6 col-12 mb-2">
                  <Input
                    type="text"
                    lable={t("SPO2")}
                    className="form-control"
                    value={initialState?.spo2}
                    name="spo2"
                    id="spo2"
                    placeholder=""
                    onChange={handleChange}
                    placeholderLabel="%"
                    respclass="row-12"
                  />
                </div>
                <div className="col-xl-2 col-md-4 col-sm-6 col-12 mb-2">
                  <Input
                    type="text"
                    lable={t("Temp")}
                    className="form-control"
                    placeholder=""
                    onChange={handleChange}
                    value={initialState?.temp}
                    name="temp"
                    id="temp"
                    respclass="row-12"
                  />
                </div>
                <div className="col-xl-2 col-md-4 col-sm-6 col-12 mb-2">
                  <Input
                    type="text"
                    lable={t("rbs")}
                    placeholder=""
                    className="form-control"
                    name="rbs"
                    id="rbs"
                    value={initialState?.rbs}
                    onChange={handleChange}
                    placeholderLabel="mmol/L"
                    respclass="row-12"
                  />
                </div>
                <div className="col-xl-2 col-md-4 col-sm-6 col-12 mb-2">
                  <Input
                    type="text"
                    lable={t("HCV")}
                    className="form-control"
                    value={initialState?.hcv}
                    onChange={handleChange}
                    name="hcv"
                    id="hcv"
                    placeholder=""
                    placeholderLabel="g/dl"
                    respclass="-12"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="row">
            <ReactSelect
              placeholderName={t("HIV Test")}
              name="hivTest"
              dynamicOptions={hivTestOptions}
              value={initialState?.hivTest}
              handleChange={handleSelect}
              respclass="col-xl-2 col-md-4 col-sm-4 col-12"
            />

            <DatePicker
              placeholder={VITE_DATE_FORMAT}
              className="custom-calendar"
              lable={t("Screening Date")}
              name="screeingDate1"
              id="screeingDate1"
              value={initialState?.screeingDate1}
              showTime
              hourFormat="12"
              handleChange={handleChange}
              respclass="col-xl-2 col-md-4 col-sm-4 col-12"
            />
            <ReactSelect
              placeholderName={t("Hepatitis B Surface Ag")}
              name="hepatitisBSurfaceAg"
              dynamicOptions={hepatitisSurface}
              value={initialState?.hepatitisBSurfaceAg}
              handleChange={handleSelect}
              respclass="col-xl-2 col-md-4 col-sm-4 col-12"
            />
            <DatePicker
              placeholder={VITE_DATE_FORMAT}
              className="custom-calendar"
              lable={t("Screening Date")}
              name="screeingDate2"
              id="screeingDate2"
              value={initialState?.screeingDate2}
              showTime
              hourFormat="12"
              handleChange={handleChange}
              respclass="col-xl-2 col-md-4 col-sm-4 col-12"
            />
            <ReactSelect
              placeholderName={t("Hepatitis C Antibody")}
              name="heapatitisCAntiBody"
              dynamicOptions={hepatitisSurface}
              value={initialState?.heapatitisCAntiBody}
              handleChange={handleSelect}
              respclass="col-xl-2 col-md-4 col-sm-4 col-12"
            />
            <DatePicker
              placeholder={VITE_DATE_FORMAT}
              className="custom-calendar"
              lable={t("Screening Date")}
              name="screeingDate3"
              id="screeingDate3"
              value={initialState?.screeingDate3}
              showTime
              hourFormat="12"
              handleChange={handleChange}
              respclass="col-xl-2 col-md-4 col-sm-4 col-12"
            />
            <Input
              type="text"
              lable={t("Current HB")}
              className="form-control"
              name="currentHB"
              id="currentHB"
              value={initialState?.currentHB}
              onChange={handleChange}
              placeholder=""
              placeholderLabel="g / dl"
              respclass="col-xl-2 col-md-4 col-sm-4 col-12"
            />
            <DatePicker
              placeholder={VITE_DATE_FORMAT}
              className="custom-calendar"
              lable={t("Date Done")}
              name="dateDone"
              id="dateDone"
              value={initialState?.dateDone}
              showTime
              hourFormat="12"
              handleChange={handleChange}
              respclass="col-xl-2 col-md-4 col-sm-4 col-12"
            />
            <Input
              type="text"
              lable={t("Angio-access")}
              className="form-control"
              name="angio"
              id="angio"
              value={initialState?.angio}
              onChange={handleChange}
              placeholder=""
              placeholderLabel="g / dl"
              respclass="col-xl-2 col-md-4 col-sm-4 col-12"
            />
            <DatePicker
              placeholder={VITE_DATE_FORMAT}
              className="custom-calendar"
              lable={t("Date of Fixed:")}
              name="dateofFixed"
              id="dateofFixed"
              value={initialState?.dateofFixed}
              showTime
              hourFormat="12"
              handleChange={handleChange}
              respclass="col-xl-2 col-md-4 col-sm-4 col-12"
            />
          </div>
        </div>
        <div className="d-flex justify-content-end mt-2 mb-2">
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSaveOrUpdate}
          >
            {initialState.id > 0 || isSaved ? t("Update") : t("Save")}
          </button>
        </div>
      </div>
    </>
  );
};

export default PreDialysisVitalSign;
