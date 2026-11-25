import React, { useEffect, useState } from "react";
import Heading from "../UI/Heading";
import { useTranslation } from "react-i18next";
import Input from "../formComponent/Input";
import { saveOrUpdateIntesiveCareUnitApacheApi, getIntesiveCareUnitApacheApi } from "../../networkServices/nursingWardAPI";
import { notify } from "../../utils/ustil2";
import Tables from "../UI/customTable";


const ScoreGroup = ({
    title,
    options,
    selectedValue,
    pointValue,
    onChange,
    isGCS = false,
}) => {
    const [t] = useTranslation();
    return (
        <div className="border p-3 mb-3 h-1/5 overflow-auto">
            <h6 className="fw-bold mb-2">{title}</h6>

            {!isGCS && options.map((item) => (
                <label key={item.value} className="d-flex align-items-center mb-1">
                    <input
                        type="radio"
                        name={title}
                        checked={selectedValue === item.value}
                        onChange={() => onChange(item)}
                        className="me-2"
                    />
                    <span className="">{item.label}</span>
                    <span className="text-muted">{item.points} {t("Points")}</span>
                </label>
            ))}

            {isGCS && (
                <>
                    <label className="form-label">
                        {t("Enter Glasgow Coma Score (3–15)")}
                    </label>
                    <Input
                        type="number"
                        min={3}
                        max={15}
                        className="form-control"
                        value={selectedValue || ""}
                        onChange={(e) => {
                            const value = e.target.value;

                            if (value === "") {
                                onChange({ value: "", points: "" });
                                return;
                            }

                            const gcs = Number(value);

                            if (Number.isNaN(gcs)) return;

                            // const points =
                            //     gcs >= 3 && gcs <= 15 ? 15 - gcs : "";

                            onChange({
                                value: gcs,
                                points: gcs,

                            });
                        }}
                    />
                </>
            )}
            {!isGCS &&
                <div className="mt-2">
                    <label className="form-label">{t("Point Value for")} {title}</label>
                    <input
                        type="text"
                        className="form-control"
                        value={pointValue}
                        disabled
                    />
                </div>
            }
        </div>
    );
};



const ApacheScoreSheet = ({ data }) => {
    const [t] = useTranslation();
    const { patientID, transactionID } = data;
    console.log(patientID, transactionID);

    const [payload, setPayload] = useState(
        {
            id: 0,
            ageInYears: "",
            ageValue: "",

            history: "",
            historyValue: "",

            rectal_Temp: "",
            tempValue: "",

            meanArterialPressure: "",
            mapValue: "",

            heartRate: "",
            valueHeartRate: "",

            respiratoryRate: "",
            valueRespiratory: "",

            oxygenation: "",
            valueOxygenation: "",

            arterialPH: "",
            valuePH: "",

            serumSodium: "",
            valueSerumSodium: "",

            serumPotassium: "",
            valueK: "",

            serumCreatinine: "",
            valueCreatinine: "",

            hematocrit: "",
            valueHematocrit: "",

            whiteBloodCount: "",
            valueWBC: "",

            glusgow: "Glusgow",
            valueGlusgow: "",

            totalAllPoints: "",
            scoringPerformedBy: "",

        },
    );
    const [isSave, setIsSave] = useState(null)
    const AGE_OPTIONS = [
        { label: t("Under 44"), value: "under44", points: 0 },
        { label: "45–54", value: "45-54", points: 2 },
        { label: "55–64", value: "55-64", points: 3 },
        { label: "65–74", value: "65-74", points: 5 },
        { label: t("Over 74"), value: "over74", points: 6 },
    ];
    const [tableData, setTableData] = useState([])
    const THEAD = [
        { name: t("S.No"), width: "1%" },
        { name: t("UHID"), width: "10%" },
        { name: t("created By"), width: "10%" },
        { name: t("Action"), width: "1%" },
    ]
    const HISTORY_OPTIONS = [
        {
            label: t("Yes – Non-operative or Emergency Post-operative"),
            value: "yes_nonop_emergency",
            points: 5,
        },
        {
            label: t("Yes – Elective Post-operative"),
            value: "yes_elective_postop",
            points: 2,
        },
        {
            label: t("No"),
            value: "no",
            points: 0,
        },
    ];
    const Rectal_options = [
        { label: t("Over 40.9"), value: "over40.9", points: 4 },
        { label: "39–40.9", value: "39-40.9", points: 3 },
        { label: "38.5–38.9", value: "38.5-38.9", points: 1 },
        { label: "36–38.4", value: "36-38.4", points: 0 },
        { label: "34–35.9", value: "34-35.9", points: 1 },
        { label: "32–33.9", value: "32-33.9", points: 2 },
        { label: "30–31.9", value: "30-31.9", points: 3 },
        { label: t("Below 30"), value: "below30", points: 4 },
    ]
    const MAP_OPTIONS = [
        { label: t("Over 159"), value: "over159", points: 4 },
        { label: "130–159", value: "130-159", points: 3 },
        { label: "110–129", value: "110-129", points: 2 },
        { label: "70–109", value: "70-109", points: 0 },
        { label: "50–69", value: "50-69", points: 2 },
        { label: t("Below 50"), value: "below50", points: 4 },
    ];
    const HEART_RATE_OPTIONS = [
        { label: t("Over 179"), value: "over179", points: 4 },
        { label: "140–179", value: "140-179", points: 3 },
        { label: "110–139", value: "110-139", points: 2 },
        { label: "70–109", value: "70-109", points: 0 },
        { label: "55–69", value: "55-69", points: 2 },
        { label: "40–54", value: "40-54", points: 3 },
        { label: t("Below 40"), value: "below40", points: 4 },
    ]
    const RESP_RATE_OPTIONS = [
        { label: t("Over 49"), value: "over49", points: 4 },
        { label: "35–49", value: "35-49", points: 3 },
        { label: "25–34", value: "25-34", points: 1 },
        { label: "12–24", value: "12-24", points: 0 },
        { label: "10–11", value: "10-11", points: 1 },
        { label: "6–9", value: "6-9", points: 2 },
        { label: t("Below 6"), value: "below6", points: 4 },
    ];
    const OXYGENATION_OPTIONS = [
        { label: t("A-a gradient > 499"), value: "aa_over_499", points: 4 },
        { label: t("A-a gradient 350–499"), value: "aa_350_499", points: 3 },
        { label: t("A-a gradient 200–349"), value: "aa_200_349", points: 2 },
        {
            label:
                t("A-a <200 (FiO2 >49%) OR PaO2 >70 (FiO2 <50%)"),
            value: "normal",
            points: 0,
        },
        { label: t("PaO2 61–70"), value: "po2_61_70", points: 1 },
        { label: t("PaO2 55–60"), value: "po2_55_60", points: 3 },
        { label: t("PaO2 <55"), value: "po2_below_55", points: 4 },
    ];
    const PH_OPTIONS = [
        { label: t("Over 7.69"), value: "over7.69", points: 4 },
        { label: "7.60–7.69", value: "7.60-7.69", points: 3 },
        { label: "7.50–7.59", value: "7.50-7.59", points: 1 },
        { label: "7.33–7.49", value: "7.33-7.49", points: 0 },
        { label: "7.25–7.32", value: "7.25-7.32", points: 2 },
        { label: "7.15–7.24", value: "7.15-7.24", points: 3 },
        { label: t("Below 7.15"), value: "below7.15", points: 4 },
    ];
    const SODIUM_OPTIONS = [
        { label: t("Over 179"), value: "over179", points: 4 },
        { label: "160–179", value: "160-179", points: 3 },
        { label: "155–159", value: "155-159", points: 2 },
        { label: "150–154", value: "150-154", points: 1 },
        { label: "130–149", value: "130-149", points: 0 },
        { label: "120–129", value: "120-129", points: 2 },
        { label: "111–119", value: "111-119", points: 3 },
        { label: t("Below 111"), value: "below111", points: 4 },
    ];
    const POTASSIUM_OPTIONS = [
        { label: t("Over 6.9"), value: "over6.9", points: 4 },
        { label: "6.0–6.9", value: "6.0-6.9", points: 3 },
        { label: "5.5–5.9", value: "5.5-5.9", points: 1 },
        { label: "3.5–5.4", value: "3.5-5.4", points: 0 },
        { label: "3.0–3.4", value: "3.0-3.4", points: 1 },
        { label: "2.5–2.9", value: "2.5-2.9", points: 2 },
        { label: t("Below 2.5"), value: "below2.5", points: 4 },
    ];
    const CREATININE_OPTIONS = [
        { label: t("Over 3.4 & Acute Renal Failure"), value: "over3.4_acute", points: 8 },
        { label: t("2.0–3.4 & Acute Renal Failure"), value: "2.0-3.4_acute", points: 6 },
        { label: t("Over 3.4 & Chronic Renal Failure"), value: "over3.4_chronic", points: 4 },
        { label: t("1.5–1.9 & Acute Renal Failure"), value: "1.5-1.9_acute", points: 4 },
        { label: t("2.0–3.4 & Chronic"), value: "2.0-3.4_chronic", points: 3 },
        { label: t("1.5–1.9 & Chronic"), value: "1.5-1.9_chronic", points: 2 },
        { label: "0.6–1.4", value: "0.6-1.4", points: 0 },
        { label: t("Below 0.6"), value: "below0.6", points: 2 },
    ];
    const HEMATOCRIT_OPTIONS = [
        { label: t("Over 59.9"), value: "over59.9", points: 4 },
        { label: "50–59.9", value: "50-59.9", points: 2 },
        { label: "46–49.9", value: "46-49.9", points: 1 },
        { label: "30–45.9", value: "30-45.9", points: 0 },
        { label: "20–29.9", value: "20-29.9", points: 2 },
        { label: t("Below 20"), value: "below20", points: 4 },
    ];
    const WBC_OPTIONS = [
        { label: t("Over 39"), value: "over39", points: 4 },
        { label: "20–39.9", value: "20-39.9", points: 2 },
        { label: "15–19.9", value: "15-19.9", points: 1 },
        { label: "3.0–14.9", value: "3.0-14.9", points: 0 },
        { label: "1.0–2.9", value: "1.0-2.9", points: 2 },
        { label: t("Below 1.0"), value: "below1.0", points: 4 },
    ];
    const GCS_OPTIONS = [
        { label: t("15 - GCS"), value: "15_minus_gcs", points: "dynamic" }
    ];
    const APACHE_MORTALITY = [
        { range: "0–4", deathRate: "4%" },
        { range: "5–9", deathRate: "8%" },
        { range: "10–14", deathRate: "15%" },
        { range: "15–19", deathRate: "25%" },
        { range: "20–24", deathRate: "40%" },
        { range: "25–29", deathRate: "55%" },
        { range: "30–34", deathRate: "75%" },
        { range: "Over 34", deathRate: "85%" },
    ];

    const POINT_KEYS = [
        "ageValue",
        "historyValue",
        "tempValue",
        "mapValue",
        "valueHeartRate",
        "valueRespiratory",
        "valueOxygenation",
        "valuePH",
        "valueSerumSodium",
        "valueK",
        "valueCreatinine",
        "valueHematocrit",
        "valueWBC",
        "valueGlusgow",
    ];
    const handleScoreChange = (valueKey, pointKey, selected) => {

        setPayload(prev => {
            const updated = {
                ...prev,
                [valueKey]: selected.value,
                [pointKey]: selected.points,
            };

            const total = POINT_KEYS.reduce(
                (sum, key) => sum + Number(updated[key] || 0),
                0
            );
            // const total =
            //     Number(updated.ageValue || 0) +
            //     Number(updated.historyValue || 0) +
            //     Number(updated.tempValue || 0) +
            //     Number(updated.mapValue || 0) +
            //     Number(updated.valueHeartRate || 0) +
            //     Number(updated.valueRespiratory || 0) +
            //     Number(updated.valueOxygenation || 0) +
            //     Number(updated.valuePH || 0) +
            //     Number(updated.valueSerumSodium || 0) +
            //     Number(updated.valueK || 0) +
            //     Number(updated.valueCreatinine || 0) +
            //     Number(updated.valueHematocrit || 0) +
            //     Number(updated.valueWBC || 0) +
            //     Number(updated.valueGlusgow || 0);

            return {
                ...updated,
                totalAllPoints: total,
            };
        });
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setPayload((val) => ({ ...val, [name]: value }))
    };

    const HandleSave = async () => {
        const payloadData = {
            ...payload,
            patientId: patientID,
            transactionId: transactionID,
        }
        const res = await saveOrUpdateIntesiveCareUnitApacheApi(payloadData)
        if (res?.success) {
            notify(res?.message, "success")
        } else {
            notify(res?.message, "error")
        }
    }
    const handleEdit = (row) => {
        debugger
        setPayload(prev => ({
            ...prev,
            ...row,
        }));
        setIsSave(true);
    }
    const fetchDataList = async () => {
        const res = await getIntesiveCareUnitApacheApi(patientID)
        if (res?.success) {
            setTableData(res?.data)
            setIsSave("true")
        } else {
            setTableData([])
            setIsSave("false")
        }
    }
    useEffect(() => {
        fetchDataList()
    }, [])
    return (
        <div className="mt-2 spatient_registration_card card">
            <Heading title={t("APACHE SCORE SHEET")} />
            <div className="row p-2">
                <div className="col-md-6 col-lg-3">
                    <ScoreGroup
                        title={t("Age")}
                        options={AGE_OPTIONS}
                        selectedValue={payload.ageInYears}
                        pointValue={payload.ageValue}
                        onChange={(val) =>
                            handleScoreChange("ageInYears", "ageValue", val)
                        }
                    />

                </div>
                <div className="col-md-6 col-lg-3">
                    <ScoreGroup
                        title={t("History")}
                        options={HISTORY_OPTIONS}
                        selectedValue={payload.history}
                        pointValue={payload.historyValue}
                        onChange={(val) => handleScoreChange("history", "historyValue", val)}
                    />
                </div>

                <div className="col-md-6 col-lg-3">
                    <ScoreGroup
                        title={t("Rectal Temperature (Celcius)")}
                        options={Rectal_options}
                        selectedValue={payload.rectal_Temp}
                        pointValue={payload.tempValue}
                        onChange={(val) => handleScoreChange("rectal_Temp", "tempValue", val)}
                    />
                </div>
                <div className="col-md-6 col-lg-3">
                    <ScoreGroup
                        title={t("Mean Arterial Pressure (mmHg)")}
                        options={MAP_OPTIONS}
                        selectedValue={payload.meanArterialPressure}
                        pointValue={payload.mapValue}
                        onChange={(val) => handleScoreChange("meanArterialPressure", "mapValue", val)}
                    />
                </div>
                <div className="col-md-6 col-lg-3">
                    <ScoreGroup
                        title={t("Heart Rate (Ventricular response)")}
                        options={HEART_RATE_OPTIONS}
                        selectedValue={payload.heartRate}
                        pointValue={payload.valueHeartRate}
                        onChange={(val) => handleScoreChange("heartRate", "valueHeartRate", val)}
                    />
                </div>
                <div className="col-md-6 col-lg-3">
                    <ScoreGroup
                        title={t("Respiratory Rate (Non-Ventilated or Ventilated)")}
                        options={RESP_RATE_OPTIONS}
                        selectedValue={payload.respiratoryRate}
                        pointValue={payload.valueRespiratory}
                        onChange={(val) => handleScoreChange("respiratoryRate", "valueRespiratory", val)}
                    />
                </div>
                <div className="col-md-6 col-lg-3">
                    <ScoreGroup
                        title={t("Oxygenation (use PaO2 if FiO2 < 50% otherwise use A-a gradient)")}
                        options={OXYGENATION_OPTIONS}
                        selectedValue={payload.oxygenation}
                        pointValue={payload.valueOxygenation}
                        onChange={(val) => handleScoreChange("oxygenation", "valueOxygenation", val)}
                    />
                </div>
                <div className="col-md-6 col-lg-3">
                    <ScoreGroup
                        title={t("Arterial pH")}
                        options={PH_OPTIONS}
                        selectedValue={payload.arterialPH}
                        pointValue={payload.valuePH}
                        onChange={(val) => handleScoreChange("arterialPH", "valuePH", val)}
                    />
                </div>
                <div className="col-md-6 col-lg-3">
                    <ScoreGroup
                        title={t("Serum Sodium (mMol/L)")}
                        options={SODIUM_OPTIONS}
                        selectedValue={payload.serumSodium}
                        pointValue={payload.valueSerumSodium}
                        onChange={(val) => handleScoreChange("serumSodium", "valueSerumSodium", val)}
                    />
                </div>
                <div className="col-md-6 col-lg-3">
                    <ScoreGroup
                        title={t("Serum Potassium (m/Mol/L)")}
                        options={POTASSIUM_OPTIONS}
                        selectedValue={payload.serumPotassium}
                        pointValue={payload.valueK}
                        onChange={(val) => handleScoreChange("serumPotassium", "valueK", val)}
                    />
                </div>
                <div className="col-md-6 col-lg-3">
                    <ScoreGroup
                        title={t("Serum Creatinine (mg/100mL)")}
                        options={CREATININE_OPTIONS}
                        selectedValue={payload.serumCreatinine}
                        pointValue={payload.valueCreatinine}
                        onChange={(val) => handleScoreChange("serumCreatinine", "valueCreatinine", val)}
                    />
                </div>
                <div className="col-md-6 col-lg-3">
                    <ScoreGroup
                        title={t("Hematicrit (%)")}
                        options={HEMATOCRIT_OPTIONS}
                        selectedValue={payload.hematocrit}
                        pointValue={payload.valueHematocrit}
                        onChange={(val) => handleScoreChange("hematocrit", "valueHematocrit", val)}
                    />
                </div>
                <div className="col-md-6 col-lg-3">
                    <ScoreGroup
                        title={t("White Blood Count (total/cubic mm in 1000's)")}
                        options={WBC_OPTIONS}
                        selectedValue={payload.whiteBloodCount}
                        pointValue={payload.valueWBC}
                        onChange={(val) => handleScoreChange("whiteBloodCount", "valueWBC", val)}
                    />
                </div>
                <div className="col-md-6 col-lg-3">

                    <ScoreGroup
                        title={t("15 minus the Glasgow Coma Score")}
                        options={GCS_OPTIONS}
                        selectedValue={payload.glusgow}
                        pointValue={payload.valueGlusgow}
                        isGCS={true}
                        onChange={(val) =>
                            handleScoreChange("glusgow", "valueGlusgow", val)
                        }
                    />
                </div>
                <div className="border p-3 fw-bold">
                    {t("Total of all Points Apache Score:")} {payload.totalAllPoints}
                    {APACHE_MORTALITY?.map((item) => {
                        return (
                            <ul>
                                <li>
                                    <span>
                                        {item?.range},
                                    </span> ~
                                    <span >
                                        {item?.deathRate}
                                    </span>
                                </li>
                            </ul>
                        )
                    })}
                </div>
            </div>
            <Input
                type="text"
                className="form-control"
                id="scoringPerformedBy"
                name="scoringPerformedBy"
                value={payload?.scoringPerformedBy}
                onChange={handleChange}
                lable={t("scoring Performed By")}
                placeholder=""
                respclass="col-xl-2 col-md-4 col-sm-6 col-12"
            />
            {isSave !== 'true' ?

                <div className="p-2">
                    <button className="btn btn-sm btn-success" type="button" style={{ float: "right" }} onClick={HandleSave}>
                        {payload?.id === 0 ? t("Save") : t("Update")}
                    </button>
                </div>
                : ""}

            {tableData?.length > 0 ?
                <>
                    <Heading title={t("Apache Score Sheet List")} />
                    <Tables thead={THEAD} tbody={tableData?.map((item, index) => ({
                        SNO: index + 1,
                        PatientID: item?.patientId,
                        createdBy: item?.createdBy,
                        Edit: <i className="fa fa-edit" aria-hidden="true" onClick={() => { handleEdit(item) }}></i>
                    }))}
                    />
                </>
                : ""
            }

            {/* <pre className="mt-3 bg-light p-2">
                {JSON.stringify(payload, null, 2)}
            </pre> */}
        </div>
    );
};

export default ApacheScoreSheet;
