import { useTranslation } from "react-i18next";

import { useEffect, useState } from "react";
import ReactSelect from "../formComponent/ReactSelect";
import TextAreaInput from "../formComponent/TextAreaInput";
import {
  getHemodialysis_Dialysis_ExaminationApi,
  saveHemodialysis_Dialysis_ExaminationApi,
  UpdateHemodialysis_Dialysis_ExaminationApi,
} from "../../networkServices/nursingWardAPI";

const DialysisExamination = ({ data }) => {
  const [t] = useTranslation();
  const { patientID, transactionID } = data;

  const [values, setValues] = useState({
    id: 0,
    patientId: "",
    transactionId: "",
    historyOfPresentingIllness: "",
    previousDialysisHistory: "",
    cns: "",
    cvs: "",
    resp: "",
    renal: "",
    git: "",
    skin: "",
    statusOfTheAccess: "",
    nurshingDiagnosis: "",
    planOfCare: "",
    isActive: "",
    arrived: "",
    mentalStatus: "",
    surrendered: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues({
      ...values,
      [name]: value,
    });
  };
  const handleReactSelect = (name, e) => {
    setValues({
      ...values,
      [name]: e.value,
    });
  };
  const YESNODROPDOWN = [
    { label: t("YES"), value: "1" },
    { label: t("NO"), value: "0" },
  ];
  const arrivedOptions = [
    { label: "--Select--", value: "0" },
    { label: t("Walking"), value: "Walking" },
    { label: t("Wheel Chair"), value: "Wheel Chair" },
    { label: t("Stretcher"), value: "Stretcher" },
    { label: t("Supported"), value: "Supported" },
  ];
  const mentalStatusOption = [
    { label: "--Select--", value: "0" },
    { label: t("Conscious"), value: "Conscious" },
    { label: t("Drowsy"), value: "Drowsy" },
    { label: t("Confused"), value: "Confused" },
    { label: t("Disoriented"), value: "Disoriented" },
    { label: t("Comatosed"), value: "Comatosed" },
  ];
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = async () => {
    const payload = {
      id: values.id,
      patientId: patientID,
      transactionId: transactionID,

      historyOfPresentingIllness: values.historyOfPresentingIllness,
      previousDialysisHistory: values.previousDialysisHistory,
      cns: values.cns,
      cvs: values.cvs,
      resp: values.resp,
      renal: values.renal,
      git: values.git,
      skin: values.skin,
      statusOfTheAccess: values.statusOfTheAccess,
      nurshingDiagnosis: values.nurshingDiagnosis,
      planOfCare: values.planOfCare,
      isActive: values.isActive,
      arrived: values.arrived,
      mentalStatus: values.mentalStatus,
      surrendered: values.surrendered,
    };

    const apiCall =
      values.id > 0
        ? UpdateHemodialysis_Dialysis_ExaminationApi
        : saveHemodialysis_Dialysis_ExaminationApi;

    const res = await apiCall(payload);

    if (res?.success) {
      notify(res.message, "success");
      setIsSaved(true);
      fetchList();
    }
  };

  const fetchList = async () => {
    try {
      const res = await getHemodialysis_Dialysis_ExaminationApi(
        transactionID,
        patientID
      );

      if (res?.success && res.data?.length > 0) {
        const r = res.data[0];

        setValues({
          id: r.Id ?? 0,
          patientId: r.PatientId ?? "",
          transactionId: r.TransactionId ?? "",

          historyOfPresentingIllness: r.HistoryOfPresentingIllness ?? "",
          previousDialysisHistory: r.PreviousDialysisHistory ?? "",

          cns: r.CNS ?? "",
          cvs: r.CVS ?? "",
          resp: r.Resp ?? "",
          renal: r.Renal ?? "",
          git: r.Git ?? "",
          skin: r.Skin ?? "",

          statusOfTheAccess: r.StatusOfTheAccess ?? "",
          nurshingDiagnosis: r.NurshingDiagnosis ?? "",
          planOfCare: r.PlanOfCare ?? "",

          isActive: r.IsActive?.toString() ?? "",
          arrived: r.Arrived ?? "",
          mentalStatus: r.MentalStatus ?? "",
          surrendered: r.Surrendered ?? "",
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
  return (
    <div className="mt-2 spatient_registration_card">
      <div className="patient_registration card">
        <div className="row p-2">
          <TextAreaInput
            type="text"
            name="historyOfPresentingIllness"
            id="historyOfPresentingIllness"
            value={values?.historyOfPresentingIllness}
            onChange={handleChange}
            lable={t("HISTORY OF PRESENTING ILLNESS ")}
            placeholder=" "
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
          />
          <TextAreaInput
            type="text"
            lable={t("previousDialysisHistory")}
            placeholder=""
            name="previousDialysisHistory"
            id="previousDialysisHistory"
            value={values?.previousDialysisHistory}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            onChange={handleChange}
            placeholderLabel="m/s"
          />
          <TextAreaInput
            type="text"
            lable={t("CNS")}
            placeholder=""
            name="cns"
            id="cns"
            value={values?.cns}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            onChange={handleChange}
          />
          <TextAreaInput
            type="text"
            lable={t("CVS")}
            placeholder=""
            name="cvs"
            id="cvs"
            value={values?.cvs}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            onChange={handleChange}
          />
          <TextAreaInput
            type="text"
            lable={t("Blood Flow Rate")}
            placeholder=""
            name="bloodFlowRate"
            id="bloodFlowRate"
            value={values?.bloodFlowRate}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            onChange={handleChange}
            placeholderLabel="ms/min"
          />
          <TextAreaInput
            type="text"
            lable={t("Resp")}
            placeholder=""
            name="resp"
            id="resp"
            value={values?.resp}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            onChange={handleChange}
          />
          <TextAreaInput
            type="text"
            lable={t("Renal")}
            placeholder=""
            name="renal"
            id="dialysisSolutions"
            value={values?.renal}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            onChange={handleChange}
          />
          <TextAreaInput
            type="text"
            lable={t("Git")}
            placeholder=""
            name="git"
            id="git"
            value={values?.git}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            onChange={handleChange}
          />
          <TextAreaInput
            type="text"
            lable={t("SKIN/EXTREMITIES")}
            placeholder=""
            name="skin"
            id="skin"
            value={values?.skin}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            onChange={handleChange}
            placeholderLabel="mmol/l"
          />
          <TextAreaInput
            type="text"
            lable={t("STATUS OF THE ACCESS :")}
            placeholder=""
            name="statusOfTheAccess"
            id="statusOfTheAccess"
            value={values?.statusOfTheAccess}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            onChange={handleChange}
            placeholderLabel="mmol/l"
          />
          <ReactSelect
            respclass={"col-xl-2 col-md-3 col-sm-4 col-12"}
            id="surrendered"
            name="surrendered"
            value={values?.surrendered}
            placeholderName={t("SURRENDERED BELONGINGS :")}
            removeIsClearable={true}
            dynamicOptions={YESNODROPDOWN}
            handleChange={handleReactSelect}
          />
          <ReactSelect
            respclass={"col-xl-2 col-md-3 col-sm-4 col-12"}
            id="arrived"
            name="arrived"
            value={values?.arrived}
            placeholderName={t("ARRIVED")}
            removeIsClearable={true}
            dynamicOptions={arrivedOptions}
            handleChange={handleReactSelect}
          />

          <ReactSelect
            respclass={"col-xl-2 col-md-3 col-sm-4 col-12"}
            id="mentalStatus"
            name="mentalStatus"
            value={values?.mentalStatus}
            placeholderName={t("MENTAL STATUS")}
            removeIsClearable={true}
            dynamicOptions={mentalStatusOption}
            handleChange={handleReactSelect}
          />
          <TextAreaInput
            type="text"
            lable={t("NURSING DIAGNOSIS")}
            placeholder=""
            name="nurshingDiagnosis"
            id="nurshingDiagnosis"
            value={values?.nurshingDiagnosis}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            onChange={handleChange}
            placeholderLabel="mmol/l"
          />
          <TextAreaInput
            type="text"
            lable={t("PLAN OF CARE / DRS ORDER :")}
            placeholder=""
            name="planOfCare"
            id="planOfCare"
            value={values?.planOfCare}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            onChange={handleChange}
            placeholderLabel="iu"
          />
        </div>
      </div>
      <div className="d-flex justify-content-end mt-2 mb-2">
        <button type="button" className="btn btn-primary" onClick={handleSave}>
          {values.id > 0 || isSaved ? t("Update") : t("Save")}
        </button>
      </div>
    </div>
  );
};

export default DialysisExamination;
