import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import Tables from "../UI/customTable";
import TextAreaInput from "../formComponent/TextAreaInput";
import {
  saveDiagnosisApi,
  updateDiagnosisApi,
  getDiagnosisApi,
} from "../../networkServices/nursingWardAPI";
import { notify } from "../../utils/utils";

const Diagnosis = ({ data }) => {
  const { t } = useTranslation();
  const { transactionID, patientID } = data;
  const [isSaved, setIsSaved] = useState(false);
  const [selectedDiagnosis, setSelectedDiagnosis] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState([]);
  const [evaluation, setEvaluation] = useState("");

  const nursingDiagnosisOptions = [
    {
      id: 1,
      label:
        "Fluid overload related to renal failure as evidenced by edema, distended jugular vein, pulmonary edema. OBJ: Normal fluid status maintained.",
    },
    {
      id: 2,
      label:
        "Electrolyte imbalance related to renal insufficiency as evidenced by deranged urea, ECG findings and jerky movements. OBJ: Normal electrolytes maintained.",
    },
    {
      id: 3,
      label:
        "Altered nutrition less than body requirement related to diet restriction, washout during dialysis, anorexia. OBJ: Adequate nutrition maintained.",
    },
    {
      id: 4,
      label:
        t("Risk for hypotension as evidenced by low BP. OBJ: Normal BP maintained."),
    },
    { id: 5, label: "Risk for Dialysis Disequilibrium as evidenced by: Confusion change in mental status, convulsions, and restlessness OBJ: Pt won't develop disequilibriu syndrome."},
    { id: 6, label: t("OBJ: Pt won't bleed/clot.") },
    { id: 7, label: t("Risk for Bleeding/clothing from angio- site as evidenced by; Prolonged bleeding.") },
    { id: 8, label: t("Risk for anaemia related to renal insufficiency. OBJ Maintain normal HB") },
    { id: 9, label: t("Risk for infection related to invasive & procedures OBJ: Pts won't develop infection.") },
    { id: 10, label: t("Risk for Hypoglycemia related to dialysis washout & poor feeding OBJ: Normal blood sugar level to be maintained.") },
  ];

  const planOfCareOptions = [
    { id: 1, label: t("Monitor patient's weight pre and post dialysis.") },
    { id: 2, label: t("Educate patient and relatives on fluid restriction.") },
    { id: 3, label: t("Ultrafiltrate weight gain as per doctor's prescription.") },
    { id: 4, label: t("Monitor pulse and blood pressure.") },
    { id: 5, label: t("Do chest X-ray if necessary.") },
    { id: 6, label: t("Do blood works monthly as per doctor's request.") },
    {
      id: 7,
      label:
        t("Teach signs of imbalance (muscle weakness, cramps, numbness, palpitations, nausea)."),
    },
    { id: 8, label: t("Place call light / call bell within reach.") },
    {
      id: 9,
      label: t("Use correct dialysate concentrate as per patient's electrolytes."),
    },
    { id: 10, label: t("Ensure patient is taking prescribed supplements.") },
    { id: 11, label: t("Enquire about patient's diet and tolerance.") },
    { id: 12, label: t("Educate patient on renal diet specific to condition.") },
    { id: 13, label: t("Refer patient / relatives to dietician.") },
     { id: 14, label: t("Monitor BP/pulse.") },
     { id: 15, label: "Observe for signs of low cardiac output e.g. cool clammy skin restlessness and rapid pulse." },
     { id: 16, label: t("Ensure adequate priming of the extracorporeal circuit") },
     { id: 17, label: t("Commence dialysis with low BPR and increase gradually") },
    { id: 18, label: t("For acute patient do frequent short dialysis and review U/E/C") },
    { id: 19, label: t("Use biocompatible bicarbonate membranes") },
    { id: 20, label: t("Ensure tight connections.") },
    {id: 21, label: t("Use heparin as prescribed and adjust dose as per pt.")},
    {id: 22, label: t("Observe for bleeding.")},
    {id: 23, label: t("Do coagulation screen for pts who tend to bleed.")},
    {id: 24, label: t("Educate on care of the site after dialysis.")},
    {id: 25, label: t("Monthly TBC.")},
    {id: 26, label:t("Ensure patients receive prescribed ion supplements and erythropoietin.")},
    {id:27, label:t("Complete blood returns.")},
    {id: 28, label: t("Serve patient with the appropriate diet")},
    {id: 29, label: t("Observe/angio-site for signs of infection. Maintain asepsis when connecting pts and when dialyzing.")},
    {id: 30, label: t("Educate pts/relatives on care of angio-site.")},
    {id: 31, label: t("Encourage pts to feed as tolerated during dialysis")},
    {id: 32, label: t("Monitor blood sugar closely as necessary.")},
    {id: 33, label: t("In case of low blood sugar use concentrate with glucose.")},
 ];

  const fetchDiagnosis = async () => {
    if (!transactionID || !patientID) return;

    try {
      const res = await getDiagnosisApi(transactionID, patientID);

      if (res?.success && res.data) {
        const diagnosisObj = res.data.diagnosis?.[0];

        setSelectedDiagnosis(
          diagnosisObj?.DiagnosisID
            ? diagnosisObj.DiagnosisID.split(",").map(Number)
            : []
        );

        setSelectedPlan(
          diagnosisObj?.PlanOfCare
            ? diagnosisObj.PlanOfCare.split(",").map(Number)
            : []
        );

        const evaluationArr = res.data.evaluation || [];
        setEvaluation(
          evaluationArr.length
            ? evaluationArr[evaluationArr.length - 1].Evaluation
            : ""
        );

        setIsSaved(true);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    }
  };

  useEffect(() => {
    if (transactionID && patientID) {
      fetchDiagnosis();
    }
  }, [transactionID, patientID]);

  const handleCheckboxChange = (option, type) => {
    const val = Number(option);

    if (type === "diagnosis") {
      setSelectedDiagnosis((prev) =>
        prev.includes(val)
          ? prev.filter((item) => item !== val)
          : [...prev, val]
      );
    } else {
      setSelectedPlan((prev) =>
        prev.includes(val)
          ? prev.filter((item) => item !== val)
          : [...prev, val]
      );
    }
  };

  const handleSave = async () => {
    const payload = {
      DiagnosisID: selectedDiagnosis.join(","),
      PlanOfCare: selectedPlan.join(","),
      PID: patientID,
      TID: transactionID,
      Evaluation: evaluation,
    };

    try {
      const apiCall = isSaved ? updateDiagnosisApi : saveDiagnosisApi;
      const res = await apiCall(payload);

      if (res?.success) {
        notify(res.message, "success");
        setIsSaved(true);

        fetchDiagnosis();
      } else {
        notify(res.message || "Error saving diagnosis", "error");
      }
    } catch (error) {
      console.error(error);
      notify(error?.message, "error");
    }
  };

  const nursingDiagnosisUI = (
    <div
      className="checkbox-list scrollable"
      style={{ maxHeight: "350px", overflowY: "auto" }}
    >
      {nursingDiagnosisOptions.map((item) => {
        const value = item.id;

        return (
          <div key={value} className="d-flex align-items-start mb-2">
            <input
              type="checkbox"
              className="mb-3 me-2 flex-shrink-0 mr-2"
              checked={selectedDiagnosis.includes(value)}
              value={value}
              onChange={() => handleCheckboxChange(value, "diagnosis")}
            />
            <span className="text-wrap">{item.label}</span>
          </div>
        );
      })}
    </div>
  );

  const planOfCareUI = (
    <div
      className="checkbox-list scrollable"
      style={{ maxHeight: "350px", overflowY: "auto", pb: 2 }}
    >
      {planOfCareOptions.map((item) => {
        const value = item.id;

        return (
          <div key={value} className="d-flex align-items-start mb-2">
            <input
              type="checkbox"
              className="mb-3 me-2 flex-shrink-0 mr-2"
              checked={selectedPlan.includes(value)}
              value={value}
              onChange={() => handleCheckboxChange(value, "plan")}
            />
            <span className="text-wrap">{item.label}</span>
          </div>
        );
      })}
    </div>
  );

  const evaluationUI = (
    <div className="verticalAlign-top maxHEight-100">
    <TextAreaInput
      type="text"
      placeholder=""
      name="evaluation"
      id="evaluation"
      value={evaluation}
      onChange={(e) => setEvaluation(e.target.value)}
      lable={t("Evaluation")}
      respclass="col-12"
    />
    </div>
  );

  const TBody = [
    {
      diagnosis: nursingDiagnosisUI,
      planOfCare: planOfCareUI,
      evaluation: evaluationUI,
    },
  ];

  return (
    <>
      <Tables
        thead={[
          { name: t("Nursing diagnosis/outcome"), width: '36%' },
          { name: t("Plan Of Care (Tick where applicable)"),width: '30%' },
          { name: t("Evaluation"),width: '30%' },
        ]}
        tbody={TBody}
      />

      <div className="d-flex justify-content-end mt-2 mb-2">
        <button className="btn btn-primary" onClick={handleSave}>
          {isSaved ? t("Update") : t("Save")}
        </button>
      </div>
    </>
  );
};

export default Diagnosis;
