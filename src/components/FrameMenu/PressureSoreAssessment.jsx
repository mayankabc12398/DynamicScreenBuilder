import React, { useEffect, useState } from 'react'
import Heading from '../UI/Heading';
import { useTranslation } from 'react-i18next';
import DatePicker from '../formComponent/DatePicker';
import TimePicker from '../formComponent/TimePicker';
import ReactSelect from '../formComponent/ReactSelect';
import { saveOrUpdatePressureSoreApi, getPressureSoreListApi } from '../../networkServices/Emergency';
import { notify } from '../../utils/ustil2';
import LabeledInput from '../formComponent/LabeledInput';
import Tables from '../UI/customTable';
import moment from 'moment';
import Input from '../formComponent/Input';
const PressureSoreAssessment = ({ data }) => {
    const { patientID, transactionID } = data;
    const [t] = useTranslation();
    const { VITE_DATE_FORMAT } = import.meta.env;
    const [values, setValues] = useState({
        date: new Date(),
        time: new Date(),

        generalCondition: "",
        levelConsciousness: "",
        activity: "",
        mobility: "",
        incontinence: "",
        nutrition: "",
        skin: "",

        totalscore: 0,
    })
    console.log(values);

    const [tableData, setTableData] = useState([]);
    const THEAD = [
        { name: t("S.No"), width: "1%" },
        { name: t("Date"), width: "5%" },
        { name: t("Time"), width: "5%" },

        // General Physical Condition
        { name: t("Good (minor)"), width: "5%" },
        { name: t("Fair (Major but stable, post op)"), width: "7%" },
        { name: t("Poor (chronic/serious, diabetic, septic, trauma)"), width: "7%" },

        // Level of Consciousness
        { name: t("Alert (responds readily)"), width: "7%" },
        { name: t("Lethargic (slow to respond)"), width: "7%" },
        { name: t("Responds to noxious stimuli"), width: "7%" },
        { name: t("No response to stimuli"), width: "7%" },

        // Activity
        { name: t("Ambulates without assistance"), width: "7%" },
        { name: t("Ambulates with assistance"), width: "7%" },
        { name: t("OOB to Chair only"), width: "7%" },
        { name: t("Bedridden"), width: "7%" },

        // Mobility
        { name: t("Full, active range of motion"), width: "7%" },
        { name: t("Restricted movement (needs some assistance, traction, restraints, etc.)"), width: "7%" },
        { name: t("Moves only with assistance"), width: "7%" },
        { name: t("Immobile"), width: "7%" },

        // Incontinence
        { name: t("None/Catheter intact"), width: "7%" },
        { name: t("Occasional (0-2 times in 24 hours)"), width: "7%" },
        { name: t("Usually (more than 2 times in 24 hours)"), width: "7%" },
        { name: t("Total (no control)"), width: "7%" },

        // Nutrition
        { name: t("Good (eats/drinks 75-100% of meals)"), width: "7%" },
        { name: t("Fair (eats/drinks 40-74% of meals - NG feeds)"), width: "7%" },
        { name: t("Poor (<40%, unstable/refuses to eat well, NBM, Malnourished, obese)"), width: "7%" },

        // Skin Integrity
        { name: t("Normal (Intact, well-nourished)"), width: "7%" },
        { name: t("Intact (unhealthy)"), width: "7%" },
        { name: t("Single sore"), width: "5%" },
        { name: t("Multiple sores, flaps, or grafts"), width: "7%" },

        { name: t("TOTAL SCORE"), width: "4%" },
        { name: t("SIGNATURE"), width: "5%" },
        { name: t("Edit"), width: "4%" },
    ]
    const handleChange = (e) => {
        const { name, value } = e.target;
        setValues((val) => ({ ...val, [name]: value }));
    };
    const generalPhysicalConditionOptions = [
        { label: t("Good (minor)"), value: 0 },
        { label: t("Fair (major but stable, post-op)"), value: 1 },
        { label: t("Poor (chronic/serious, diabetic, septic, trauma)"), value: 2 },
    ];
    const levelOfConsciousnessOptions = [
        { label: t("Alert (responds readily)"), value: 0 },
        { label: t("Lethargic (slow to respond)"), value: 1 },
        { label: t("Responds to noxious stimuli"), value: 2 },
        { label: t("No response to stimuli"), value: 3 },
    ];
    const activityOptions = [
        { label: t("Ambulates without assistance"), value: 0 },
        { label: t("Ambulates with assistance"), value: 2 },
        { label: t("OOB to Chair only"), value: 4 },
        { label: t("Bedridden"), value: 6 },
    ];
    const mobilityOptions = [
        { label: t("Full, active range of motion"), value: 0 },
        { label: t("Restricted movement (needs some assistance, traction, restraints, etc.)"), value: 2 },
        { label: t("Moves only with assistance"), value: 4 },
        { label: t("Immobile"), value: 6 },
    ];
    const incontinenceOptions = [
        { label: t("None / Catheter intact"), value: 0 },
        { label: t("Occasional (0–2 times in 24 hours)"), value: 2 },
        { label: t("Usually (more than 2 times in 24 hours)"), value: 4 },
        { label: t("Total (no control)"), value: 6 },
    ];
    const nutritionOptions = [
        { label: t("Good (eats/drinks 75–100% of meals)"), value: 0 },
        { label: t("Fair (eats/drinks 40–74% — NG feeds)"), value: 1 },
        { label: t("Poor (<40%, unstable, refuses to eat, NBM, malnourished)"), value: 2 },
    ];
    const skinIntegrityOptions = [
        { label: t("Normal (intact, well nourished)"), value: 0 },
        { label: t("Intact (unhealthy)"), value: 4 },
        { label: t("Single sore"), value: 6 },
        { label: t("Multiple sores, flaps, or grafts"), value: 8 },
    ];

    const handleReactSelectChange = (name, val) => {
        setValues((prev) => ({
            ...prev,
            [name]: val,
        }));
    }
    const mapGeneralConditionToPayload = (val) => ({
        good: val === 0 ? "1" : "0",
        fair: val === 1 ? "1" : "0",
        poor: val === 2 ? "1" : "0",
    });
    const mapConsciousnessToPayload = (val) => ({
        alert: val === 0 ? "1" : "0",
        lethargic: val === 1 ? "1" : "0",
        responds: val === 2 ? "1" : "0",
        noresponse: val === 3 ? "1" : "0",
    });
    const mapActivityToPayload = (val) => ({
        ambulates: val === 0 ? "1" : "0",
        ambulateswith: val === 2 ? "1" : "0",
        oob: val === 4 ? "1" : "0",
        bedridden: val === 6 ? "1" : "0",
    });
    const mapNutritionToPayload = (val) => ({
        goodeats: val === 0 ? "1" : "0",
        faireats: val === 1 ? "1" : "0",
        pooreats: val === 2 ? "1" : "0",
    });

    const mapSkinToPayload = (val) => ({
        normal: val === 0 ? "1" : "0",
        intact: val === 4 ? "1" : "0",
        singlesore: val === 6 ? "1" : "0",
        multiplesores: val === 8 ? "1" : "0",
    });
    const mapMobilityToPayload = (val) => ({
        fullactive: val === 0 ? "1" : "0",
        restricted: val === 2 ? "1" : "0",
        moves: val === 4 ? "1" : "0",
        immobile: val === 6 ? "1" : "0",
    });
    const mapIncontinenceToPayload = (val) => ({
        noneCatheter: val === 0 ? "1" : "0",
        occasional: val === 2 ? "1" : "0",
        usually: val === 4 ? "1" : "0",
        total: val === 6 ? "1" : "0",
    });

    const handleSave = async () => {
        const general = mapGeneralConditionToPayload(values.generalCondition?.value);
        const consciousness = mapConsciousnessToPayload(values.levelConsciousness?.value);
        const activity = mapActivityToPayload(values.activity?.value);
        const mobility = mapMobilityToPayload(values.mobility?.value);
        const incontinence = mapIncontinenceToPayload(values.incontinence?.value);
        const nutrition = mapNutritionToPayload(values.nutrition?.value);
        const skin = mapSkinToPayload(values.skin?.value);

        const payload = {
            id: values.id || 0,
            patientID: patientID,
            trasactionId: transactionID,
            date: values.date ? moment(values.date).format("DD-MM-YYYY") : "",
            time: values.time ? moment(values.time).format("hh:mm A") : "",

            ...general,
            ...consciousness,
            ...activity,
            ...mobility,
            ...incontinence,
            ...nutrition,
            ...skin,

            totalscore: values.totalscore,
            signature: values.signature || ""
        };

        console.log("FINAL PAYLOAD:", payload);
        const res = await saveOrUpdatePressureSoreApi(payload)
        if (res?.success) {
            notify(res?.message, "success")
            getListData()
        } else {
            notify(res?.message, "error")

        }
    };
    useEffect(() => {
        debugger
        const total =
            Number(values.generalCondition?.value ?? values.generalCondition ?? 0) +
            Number(values.levelConsciousness?.value ?? values.levelConsciousness ?? 0) +
            Number(values.activity?.value ?? values.activity ?? 0) +
            Number(values.mobility?.value ?? values.mobility ?? 0) +
            Number(values.incontinence?.value ?? values.incontinence ?? 0) +
            Number(values.nutrition?.value ?? values.nutrition ?? 0) +
            Number(values.skin?.value ?? values.skin ?? 0);

        setValues((prev) => ({ ...prev, totalscore: total }));
    }, [
        values.generalCondition,
        values.levelConsciousness,
        values.activity,
        values.mobility,
        values.incontinence,
        values.nutrition,
        values.skin,
    ]);
    const getListData = async () => {
        const res = await getPressureSoreListApi(patientID, transactionID);
        if (res?.data) {
            notify(res?.message, "success")
            setTableData(res?.data)
        } else {
            notify(res?.message, "error")
            setTableData([])
        }
    }
    const handleEdit = (row) => {
        const timeFormateDate = (time) => {
            if (!time || typeof time !== "string") return null;

            const date = new Date();

            if (/^\d{2}:\d{2}:\d{2}$/.test(time)) {
                const [h, m, s] = time.split(":").map(Number);
                date.setHours(h);
                date.setMinutes(m);
                date.setSeconds(s);
                return date;
            }

            if (/^\d{2}:\d{2}$/.test(time)) {
                const [h, m] = time.split(":").map(Number);
                date.setHours(h);
                date.setMinutes(m);
                date.setSeconds(0);
                return date;
            }

            const match = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
            if (match) {
                let [_, hh, mm, period] = match;
                hh = Number(hh);
                mm = Number(mm);
                period = period.toUpperCase();

                if (period === "PM" && hh !== 12) hh += 12;
                if (period === "AM" && hh === 12) hh = 0;

                date.setHours(hh);
                date.setMinutes(mm);
                date.setSeconds(0);
                return date;
            }
            return null;
        };

        setValues({
            id: row.id ?? 0,
            date: new Date(row.date),
            time: row.time ?timeFormateDate(row.time) : new Date(),

            generalCondition:
                row.good === "1" ? 0 :
                    row.fair === "1" ? 1 :
                        row.poor === "1" ? 2 : "",

            levelConsciousness:
                row.alert === "1" ? 0 :
                    row.lethargic === "1" ? 1 :
                        row.responds === "1" ? 2 :
                            row.noresponse === "1" ? 3 : "",

            activity:
                row.ambulates === "1" ? 0 :
                    row.ambulateswith === "1" ? 2 :
                        row.oob === "1" ? 4 :
                            row.bedridden === "1" ? 6 : "",

            mobility:
                row.fullactive === "1" ? 0 :
                    row.restricted === "1" ? 2 :
                        row.moves === "1" ? 4 :
                            row.immobile === "1" ? 6 : "",

            incontinence:
                row.noneCatheter === "1" ? 0 :
                    row.occasional === "1" ? 2 :
                        row.usually === "1" ? 4 :
                            row.total === "1" ? 6 : "",

            nutrition:
                row.goodeats === "1" ? 0 :
                    row.faireats === "1" ? 1 :
                        row.pooreats === "1" ? 2 : "",

            skin:
                row.normal === "1" ? 0 :
                    row.intact === "1" ? 4 :
                        row.singlesore === "1" ? 6 :
                            row.multiplesores === "1" ? 8 : "",

            totalscore: Number(row.totalscore),
            signature: row.signature || ""
        });
    };

    useEffect(() => {
        getListData()
    }, [])
    const handlePrint = () => {

    }
    // const RadioGroup = ({ label, name, value, onChange, options }) => {
    //     return (
    //         <div className="col-xl-12 col-md-12 col-sm-12 col-12 mb-2">
    //             {label && <label className="form-label">{label}</label>}

    //             <div className="d-flex flex-wrap gap-3">
    //                 {options.map((opt, i) => (
    //                     <label key={i} className="d-flex align-items-center gap-1">
    //                         <input
    //                             type="radio"
    //                             name={name}
    //                             value={opt.value}
    //                             checked={String(value) === String(opt.value)}
    //                             // checked={value === opt.value}
    //                             onChange={(e) => onChange(name, e.target.value)}
    //                         />
    //                         <span>{opt.label}</span>
    //                     </label>
    //                 ))}
    //             </div>
    //         </div>
    //     );
    // };

    return (
        <div className='mt-2 spatient_registration_card'>
            <div className="patient_registration card">
                <Heading
                    title={t("Pressure Sore Form")}
                    isBreadcrumb={false}
                />
                <div className='row p-2'>

                    <DatePicker
                        className={`custom-calendar `}
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                        id="DATE"
                        name="date"
                        inputClassName={"required-fields"}
                        value={values?.date ? values?.date : new Date()}
                        handleChange={handleChange}
                        lable={t("DATE")}
                        placeholder={VITE_DATE_FORMAT}
                    />
                    <TimePicker
                        placeholderName={t("time")}
                        lable={t("time")}
                        id="Time"
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                        name="time"
                        value={values?.time ? values?.time : new Date()}
                        // value={new Date(`1970-01-01T00:00:00`)}
                        handleChange={handleChange}
                    />

                    {/* <RadioGroup
                        label={t("General Physical Condition")}
                        name="generalCondition"
                        value={values.generalCondition}
                        onChange={(name, val) => setValues({ ...values, [name]: val })}
                        options={generalPhysicalConditionOptions}
                    /> */}
                    <ReactSelect
                        placeholderName={t("General Physical Condition")}
                        name="generalCondition"
                        value={values.generalCondition}
                        handleChange={handleReactSelectChange}
                        dynamicOptions={generalPhysicalConditionOptions}
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                    />
                    <ReactSelect
                        placeholderName={t("Level of Consciousness")}
                        name="levelConsciousness"
                        value={values.levelConsciousness}
                        handleChange={handleReactSelectChange}
                        dynamicOptions={levelOfConsciousnessOptions}
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                    />

                    <ReactSelect
                        placeholderName={t("Activity")}
                        name="activity"
                        value={values.activity}
                        handleChange={handleReactSelectChange}
                        dynamicOptions={activityOptions}
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                    />

                    <ReactSelect
                        placeholderName={t("Mobility")}
                        name="mobility"
                        value={values.mobility}
                        handleChange={handleReactSelectChange}
                        dynamicOptions={mobilityOptions}
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                    />

                    <ReactSelect
                        placeholderName={t("Incontinence")}
                        name="incontinence"
                        value={values.incontinence}
                        handleChange={handleReactSelectChange}
                        dynamicOptions={incontinenceOptions}
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                    />

                    <ReactSelect
                        placeholderName={t("Nutrition")}
                        name="nutrition"
                        value={values.nutrition}
                        handleChange={handleReactSelectChange}
                        dynamicOptions={nutritionOptions}
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                    />

                    <ReactSelect
                        placeholderName={t("Skin Integrity")}
                        name="skin"
                        value={values.skin}
                        handleChange={handleReactSelectChange}
                        dynamicOptions={skinIntegrityOptions}
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                    />
                    <div className="col-xl-2 col-md-4 col-sm-4 col-12">
                        <LabeledInput
                            label={t("Total")}
                            value={values?.totalscore}
                        />
                    </div>
                    <Input
                        type="text"
                        className="form-control"
                        id="signature"
                        name="signature"
                        value={values?.signature}
                        onChange={handleChange}
                        lable={t("signature")}
                        respclass="col-sm-6 col-md-4 col-lg-2 col-12"
                    />

                </div>
                <div className='p-2'>
                    <button
                        className="btn btn-primary"
                        type='button'
                        style={{ float: "right" }}
                        onClick={handleSave}
                    >
                        {values?.id ? t("Update") : t("Save")}
                    </button>
                    {/* <button
                        className="btn btn-primary mr-2"
                        type='button'
                        style={{ float: "right" }}
                        onClick={handlePrint}
                    >
                        {t("Print")}
                    </button> */}
                </div>

                {tableData?.length > 0 ?
                    <>
                        <Tables
                            thead={THEAD}
                            tbody={
                                tableData?.map((item, index) => ({
                                    SNo: index + 1,
                                    date: item.date,
                                    time: item.time,

                                    good: item.good,
                                    fair: item.fair,
                                    poor: item.poor,

                                    alert: item.alert,
                                    lethargic: item.lethargic,
                                    responds: item.responds,
                                    noresponse: item.noresponse,

                                    ambulates: item.ambulates,
                                    ambulateswith: item.ambulateswith,
                                    oob: item.oob,
                                    bedridden: item.bedridden,

                                    fullactive: item.fullactive,
                                    restricted: item.restricted,
                                    moves: item.moves,
                                    immobile: item.immobile,

                                    noneCatheter: item.noneCatheter,
                                    occasional: item.occasional,
                                    usually: item.usually,
                                    total: item.total,

                                    goodeats: item.goodeats,
                                    faireats: item.faireats,
                                    pooreats: item.pooreats,

                                    normal: item.normal,
                                    intact: item.intact,
                                    singlesore: item.singlesore,
                                    multiplesores: item.multiplesores,

                                    totalscore: item.totalscore,
                                    signature: item.signature,
                                    action: <i
                                        className="fa fa-edit"
                                        aria-hidden="true"
                                        onClick={() => {
                                            handleEdit(item);
                                        }}
                                    ></i>
                                }))}
                            scrollView={"scrollView"}

                        />
                    </>
                    : ""}
            </div>
        </div >
    )
}

export default PressureSoreAssessment;