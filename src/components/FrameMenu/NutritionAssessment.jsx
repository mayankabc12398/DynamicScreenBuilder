import React, { useEffect, useState } from 'react'
import { CentreWiseCacheByCenterID } from '../../store/reducers/common/CommonExportFunction';
import { useLocalStorage } from '../../utils/hooks/useLocalStorage';
import { useDispatch } from 'react-redux';
import { filterByType } from '../../utils/utils';
import { useSelector } from 'react-redux';
import ReactSelect from '../formComponent/ReactSelect';
import { useTranslation } from 'react-i18next';
import Heading from '../UI/Heading';
import Input from '../formComponent/Input';
import TextAreaInput from '../formComponent/TextAreaInput';
import { SaveOrUpdateNutritionAssessmentApi, getNutritionAssessmentApi } from '../../networkServices/nursingWardAPI';
import moment from 'moment';
import { notify } from '../../utils/ustil2';
import Tables from '../UI/customTable';
const NutritionAssessment = ({ data }) => {
    const { patientID, transactionID } = data;
    // const { CentreWiseCache } = useSelector(
    //     (state) => state.CommonSlice
    // );
    const [t] = useTranslation()
    // const localdata = useLocalStorage("userData", "get");
    const [values, setValues] = useState({
        id: 0,
        childhoodIllness_Measles: 0,
        childhoodIllness_Mumps: 0,
        childhoodIllness_Rubella: 0,
        childhoodIllness_Chickenpox: 0,
        childhoodIllness_Rheumatic: 0,
        childhoodIllness_Polio: 0,

        immunizations_Tetanus: 0,
        immunizations_Pneumonia: 0,
        immunizations_Hepatitis: 0,
        immunizations_Chickenpox: 0,
        immunizations_Influenza: 0,
        immunizations_MMR: 0,

        exercise_Sedentary: 0,
        exercise_Mild: 0,
        exercise_OccasionalVigorous: 0,
        exercise_RegularVigorous: 0,

        dieting_Yes: 0,
        dieting_No: 0,

        phyPrescribed_Yes: 0,
        phyPrescribed_No: 0,

        rankSaltIntake_Hi: 0,
        rankSaltIntake_Med: 0,
        rankSaltIntake_Low: 0,

        rankFatIntake_Hi: 0,
        rankFatIntake_Med: 0,
        rankFatIntake_Low: 0,

        caffeine_None: 0,
        caffeine_Coffee: 0,
        caffeine_Tea: 0,
        caffeine_Cola: 0,

        alcohol_Drink: 0,
        alcohol_Concerned_Yes: 0,
        alcohol_Concerned_No: 0,
        alcohol_ConsideredStop_Yes: 0,
        alcohol_ConsideredStop_No: 0,
        alcohol_Blackouts_Yes: 0,
        alcohol_Blackouts_No: 0,
        alcohol_Binge_Yes: 0,
        alcohol_Binge_No: 0,
        alcohol_Drink_No: 0,

        tobacco_Use_Yes: 0,
        tobacco_Use_No: 0,
        tobacco_Cigarettes: 0,
        tobacco_Chew: 0,
        tobacco_Pipe: 0,
        tobacco_Cigars: 0,
        tobacco_Years: 0,
        tobacco_YearQuit: 0,

        streetDrugs_UseY: 0,
        streetDrugs_UseN: 0,

        hyefysdwNeedle_Yes: 0,
        hyefysdwNeedle_No: 0,

        dylA_Y: 0,
        dylA_N: 0,

        dydaD_Y: 0,
        dydaD_N: 0,

        dyhfF_Y: 0,
        yhfF_N: 0,

        dyhvohL_Y: 0,
        dyhvohL_N: 0,

        s_M1: 0,
        s_F1: 0,
        s_M2: 0,
        s_F2: 0,
        s_M3: 0,
        s_F3: 0,
        s_M4: 0,
        s_F4: 0,
        s_M5: 0,
        s_F5: 0,
        s_M6: 0,
        s_F6: 0,

        c_M1: 0,
        c_F1: 0,
        c_M2: 0,
        c_F2: 0,
        c_M3: 0,
        c_F3: 0,
        c_M4: 0,
        c_F4: 0,

        ismpfY_Yes: 0,
        ismpfY_No: 0,

        dyfD_Yes: 0,
        dyfD_No: 0,

        dypwS_Yes: 0,
        dypwS_No: 0,

        dypweoyA_Yes: 0,
        dypweoyA_No: 0,

        dycF_Yes: 0,
        dycF_No: 0,

        hyeaS_Yes: 0,
        hyeaS_No: 0,

        hyestahY_Yes: 0,
        hyestahY_No: 0,

        dyhtS_Yes: 0,
        dyhtS_No: 0,

        hyebtoC_Yes: 0,
        hyebtoC_No: 0,

        skin: 0,
        headNeck: 0,
        ears: 0,
        nose: 0,
        throat: 0,
        lungs: 0,
        chestHeart: 0,
        back: 0,

        bladder1: 0,
        bowel1: 0,
        circulation1: 0,
        recentChanges: 0,
        weightChange: 0,
        energyLevel: 0,
        abilityToSleep: 0,
        otherPainDiscomfort: 0,
        intestinal: 0,

        single: 0,
        partnered: 0,
        married: 0,
        separated: 0,
        divorced: 0,
        widowed: 0,

        listMedProblem: "",
        surgeries_Year: "",
        surgeries_Reason: "",
        surgeries_Hospital: "",

        otherHospitalization_Year: "",
        otherHospitalization_Reason: "",
        otherHospitalization_Hospital: "",

        prescribedDrugs_Name: "",
        prescribedDrugs_Strength: "",
        prescribedDrugs_Frequency: "",

        mealYouEat: "",
        cupsPerDay: "",
        alcohol_Type: "",
        alcohol_DrinksPerWeek: "",

        f_Age: "",
        f_SHP: "",
        m_Age: "",
        m_SHP: "",

        s_SHP1: "",
        s_SHP2: "",
        s_SHP3: "",
        s_SHP4: "",
        s_SHP5: "",
        s_SHP6: "",

        c_SHP1: "",
        c_SHP2: "",
        c_SHP3: "",
        c_SHP4: "",

        gmM_Age: "",
        gmM_SHP: "",
        gfM_AGE: "",
        gfM_SHP: "",
        gmP_Age: "",
        gmP_SHP: "",
        gfP_Age: "",
        gfP_SHP: "",

        weight: "",
        bloodPressure: "",
        height: "",
        pulseRate: "",
        bodyMassIndex: "",
        oxygenSaturation: "",
        waistCircumference: "",
        fatPercentage: "",
        fatMass: "",
        tempurature: "",

        measles_T: "",
        mumps_T: "",
        rubella_T: "",
        chickenpox_T: "",
        rheumatic_T: "",
        polio_T: "",

        tetanus_T: "",
        pneumonia_T: "",
        hepatitis_T: "",
        chickenpox1_T: "",
        influenza_T: "",
        mmR_T: "",

        sedentary_T: "",
        mildExercise_T: "",
        occasionalvigorous_T: "",
        regularvigorous_T: "",

        ayD_T: "",
        phyprescribed_T: "",
        amtyoudrink_T: "",
        consiStop_T: "",
        hyeeB_T: "",
        ayptbD_T: "",
        dyuT_T: "",

        cigarettes_T: "",
        chew_T: "",
        pipe_T: "",
        cigars_T: "",
        ofyear_T: "",
        yearQuit_T: "",

        dycuroStreetDrug_T: "",
        hyefysdwNeedle_T: "",
        dylA_T: "",
        dyhfF_T: "",
        dyhvohL_T: "",
        dydaD_T: "",

        s_M1Age_T: "",
        s_M2Age_T: "",
        s_M3Age_T: "",
        s_M4Age_T: "",
        s_M5Age_T: "",
        s_M6Age_T: "",

        c_M1Age_T: "",
        c_M2Age_T: "",
        c_M3Age_T: "",
        c_M4Age_T: "",

        ismpfY_T: "",
        dyfD_T: "",
        dypwS_T: "",
        dypweoyA_T: "",
        dycF_T: "",
        hyeaS_T: "",
        hyestahY_T: "",
        dyhtS_T: "",
        hyebtoC_T: "",

        skin_T: "",
        head_Neck_T: "",
        ears_T: "",
        nose_T: "",
        throat_T: "",
        lungs_T: "",
        chest_Heart_T: "",
        back_T: "",
        bladder_T: "",
        bowel_T: "",
        circulation_T: "",
        recentChanges_T: "",
        weight1_T: "",
        energylevel_T: "",
        abilitytosleep_T: "",
        otherPainDiscomfort_T: "",
        intestinal_T: "",
    })
    // const dispatch = useDispatch();
    // useEffect(() => {
    //     dispatch(
    //         CentreWiseCacheByCenterID({
    //             centreID: localdata?.defaultCentre,
    //         })
    //     );

    // }, [])
    const TRUE_FALSE_OPTIONS = [
        { label: t("Yes"), value: "1" },
        { label: t("No"), value: "0" },
    ];
    const RankOPTIONS = [
        { label: t("High"), value: 1 },
        { label: t("Medium"), value: 2 },
        { label: t("Low"), value: 3 }
    ]
    const CoffineOPTIONS = [
        { label: t("None"), value: 1 },
        { label: t("Coffee"), value: 2 },
        { label: t("Tea"), value: 3 },
        { label: t("Cola"), value: 4 }
    ]


    const buildPayload = (values, patientID, transactionID) => {

        const fixed = {
            id: values?.id || 0,
            patientId: patientID || patientID,
            transactionID: transactionID || "",
        };


        const dynamic = {};

        Object.entries(values).forEach(([key, val]) => {
            debugger
            if (key in fixed) return;


            if (val && typeof val === "object" && "value" in val) {
                dynamic[key] = Number(val.value);
            }
            else if (typeof val === "number") {
                dynamic[key] = val;
            }

            else if (typeof val === "string") {
                dynamic[key] = val;
            }
            else {
                dynamic[key] = 0;
            }
        });


        return { ...fixed, ...dynamic };
    };

    const handleSave = async () => {
        const payload = buildPayload(values, patientID, transactionID);
        const res = await SaveOrUpdateNutritionAssessmentApi(payload);
        if (res?.success) {
            notify(res?.message, "success")
            fetchListData()
        } else {
            notify(res?.message, "error")
        }

    }
    const handleYesNoSelect = (name, val) => {
        const value = val?.value ?? null;
        setValues(prev => ({
            ...prev,
            [`${name}_Yes`]: value === "1" ? 1 : 0,
            [`${name}_No`]: value === "0" ? 1 : 0
        }));
    };
    const handleText = (e) => {
        setValues(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };
    const handleReactSelect = (name, val) => {
        debugger
        if (name === "Caffeine") {
            const value = val?.value?.toString() ?? "";
            setValues((prev) => ({
                ...prev,
                caffeine_None: value === "1" ? 1 : 0,
                caffeine_Coffee: value === "2" ? 1 : 0,
                caffeine_Tea: value === "3" ? 1 : 0,
                caffeine_Cola: value === "4" ? 1 : 0
            }));
            return;
        }
        if (name === "rankSaltIntake") {
            const value = val?.value?.toString() ?? "";
            setValues((prev) => ({
                ...prev,
                rankSaltIntake_Hi: value === "1" ? 1 : 0,
                rankSaltIntake_Med: value === "2" ? 1 : 0,
                rankSaltIntake_Low: value === "3" ? 1 : 0
            }));
            return;
        }
        if (name === "rankFatIntake") {
            const value = val?.value?.toString() ?? "";
            setValues((prev) => ({
                ...prev,
                rankFatIntake_Hi: value === "1" ? 1 : 0,
                rankFatIntake_Med: value === "2" ? 1 : 0,
                rankFatIntake_Low: value === "3" ? 1 : 0
            }));
            return;
        }
        if (name === "MaritalStatus") {
            const value = val?.value?.toString() ?? "";
            debugger
            setValues((prev) => ({
                ...prev,
                single: value === "Single" ? 1 : 0,
                partnered: value === "Partnered" ? 1 : 0,
                married: value === "Married" ? 1 : 0,
                separated: value === "Separated" ? 1 : 0,
                divorced: value === "Divorced" ? 1 : 0,
                widowed: value === "Widowed" ? 1 : 0,
            }));
            return;
        }
        if (name === "alcohol") {
            const value = val?.value?.toString() ?? "";
            setValues((prev) => ({
                ...prev,
                alcohol_Drink: value === "1" ? 1 : 0,
                alcohol_Drink_No: value === "0" ? 1 : 0,
            }));
            return;
        }
        if (name === "streetDrugs_Use") {
            const value = val?.value?.toString() ?? "";
            setValues((prev) => ({
                ...prev,
                streetDrugs_UseY: value === "1" ? 1 : 0,
                streetDrugs_UseN: value === "0" ? 1 : 0,
            }));
            return;
        }
        if (name === "phyPrescribed") {
            const value = val?.value?.toString() ?? "";
            setValues((prev) => ({
                ...prev,
                phyPrescribed_Yes: value === "1" ? 1 : 0,
                phyPrescribed_No: value === "0" ? 1 : 0,
            }));
            return;
        }
        if (name === "tobacco_Use") {
            const value = val?.value?.toString() ?? "";
            setValues((prev) => ({
                ...prev,
                tobacco_Use_Yes: value === "1" ? 1 : 0,
                tobacco_Use_No: value === "0" ? 1 : 0,
            }));
            return;
        }
        if (name === "dylA") {
            const value = val?.value?.toString() ?? "";
            setValues((prev) => ({
                ...prev,
                dylA_Y: value === "1" ? 1 : 0,
                dylA_N: value === "0" ? 1 : 0,
            }));
            return;
        }

        if (name === "s1_M1") {
            const value = val?.value?.toString() ?? "";
            setValues((prev) => ({
                ...prev,
                s_M1: value === "1" ? 1 : 0,
                s_F1: value === "0" ? 1 : 0,
            }));
            return;
        }
        if (name === "s2_M2") {
            const value = val?.value?.toString() ?? "";
            setValues((prev) => ({
                ...prev,
                s_M2: value === "1" ? 1 : 0,
                s_F2: value === "0" ? 1 : 0,
            }));
            return;
        }
        if (name === "s3_M3") {
            const value = val?.value?.toString() ?? "";
            setValues((prev) => ({
                ...prev,
                s_M3: value === "1" ? 1 : 0,
                s_F3: value === "0" ? 1 : 0,
            }));
            return;
        }
        if (name === "s4_M4") {
            const value = val?.value?.toString() ?? "";
            setValues((prev) => ({
                ...prev,
                s_M4: value === "1" ? 1 : 0,
                s_F4: value === "0" ? 1 : 0,
            }));
            return;
        }
        if (name === "s5_M5") {
            const value = val?.value?.toString() ?? "";
            setValues((prev) => ({
                ...prev,
                s_M5: value === "1" ? 1 : 0,
                s_F5: value === "0" ? 1 : 0,
            }));
            return;
        }
        if (name === "s6_M6") {
            const value = val?.value?.toString() ?? "";
            setValues((prev) => ({
                ...prev,
                s_M6: value === "1" ? 1 : 0,
                s_F6: value === "0" ? 1 : 0,
            }));
            return;
        }
        if (name === "c_M1") {
            const value = val?.value?.toString() ?? "";
            setValues((prev) => ({
                ...prev,
                c_M1: value === "1" ? 1 : 0,
                c_F1: value === "0" ? 1 : 0,
            }));
            return;
        }
        if (name === "c_M2") {
            const value = val?.value?.toString() ?? "";
            setValues((prev) => ({
                ...prev,
                c_M2: value === "1" ? 1 : 0,
                c_F2: value === "0" ? 1 : 0,
            }));
            return;
        }
        if (name === "c_M3") {
            const value = val?.value?.toString() ?? "";
            setValues((prev) => ({
                ...prev,
                c_M3: value === "1" ? 1 : 0,
                c_F3: value === "0" ? 1 : 0,
            }));
            return;
        }
        if (name === "c_M4") {
            const value = val?.value?.toString() ?? "";
            setValues((prev) => ({
                ...prev,
                c_M4: value === "1" ? 1 : 0,
                c_F4: value === "0" ? 1 : 0,
            }));
            return;
        }

        if (name === "dydaD") {
            const value = val?.value?.toString() ?? "";
            setValues((prev) => ({
                ...prev,
                dydaD_Y: value === "1" ? 1 : 0,
                dydaD_N: value === "0" ? 1 : 0,
            }));
            return;
        }
        if (name === "dyhvohL") {
            const value = val?.value?.toString() ?? "";
            setValues((prev) => ({
                ...prev,
                dyhvohL_Y: value === "1" ? 1 : 0,
                dyhvohL_N: value === "0" ? 1 : 0,
            }));
            return;
        }
        if (name === "dyhfF") {
            const value = val?.value?.toString() ?? "";
            setValues((prev) => ({
                ...prev,
                dyhfF_Y: value === "1" ? 1 : 0,
                dyhfF_N: value === "0" ? 1 : 0,
            }));
            return;
        }
        if (name === "alcohol_Binge") {
            const value = val?.value?.toString() ?? "";
            setValues((prev) => ({
                ...prev,
                alcohol_Binge_Yes: value === "1" ? 1 : 0,
                alcohol_Binge_No: value === "0" ? 1 : 0,
            }));
            return;
        }
        if (name === "alcohol_Blackouts") {
            const value = val?.value?.toString() ?? "";
            setValues((prev) => ({
                ...prev,
                alcohol_Blackouts_Yes: value === "1" ? 1 : 0,
                alcohol_Blackouts_No: value === "0" ? 1 : 0,
            }));
            return;
        }
        if (name === "Considered") {
            const value = val?.value?.toString() ?? "";
            setValues((prev) => ({
                ...prev,
                alcohol_Concerned_Yes: value === "1" ? 1 : 0,
                alcohol_Concerned_No: value === "0" ? 1 : 0,
            }));
            return;
        }
        if (name === "ConsideredStop") {
            const value = val?.value?.toString() ?? "";
            setValues((prev) => ({
                ...prev,
                alcohol_ConsideredStop_Yes: value === "1" ? 1 : 0,
                alcohol_ConsideredStop_No: value === "0" ? 1 : 0,
            }));
            return;
        }
        if (name === "dieting") {
            const value = val?.value?.toString() ?? "";
            setValues((prev) => ({
                ...prev,
                dieting_Yes: value === "1" ? 1 : 0,
                dieting_No: value === "0" ? 1 : 0,
            }));
            return;
        }
        if (name === "alcohol_Concerned") {
            const value = val?.value?.toString() ?? "";
            setValues((prev) => ({
                ...prev,
                alcohol_Concerned_Yes: value === "1" ? 1 : 0,
                alcohol_Concerned_No: value === "0" ? 1 : 0,
            }));
            return;
        }
        //
        if (name === "ismpfY") {
            const value = val?.value?.toString() ?? "";
            setValues(prev => ({
                ...prev,
                ismpfY_Yes: value === "1" ? 1 : 0,
                ismpfY_No: value === "0" ? 1 : 0,
            }));
            return;
        }

        if (name === "dyfD") {
            const value = val?.value?.toString() ?? "";
            setValues(prev => ({
                ...prev,
                dyfD_Yes: value === "1" ? 1 : 0,
                dyfD_No: value === "0" ? 1 : 0,
            }));
            return;
        }

        if (name === "dypwS") {
            const value = val?.value?.toString() ?? "";
            setValues(prev => ({
                ...prev,
                dypwS_Yes: value === "1" ? 1 : 0,
                dypwS_No: value === "0" ? 1 : 0,
            }));
            return;
        }

        if (name === "dypweoyA") {
            const value = val?.value?.toString() ?? "";
            setValues(prev => ({
                ...prev,
                dypweoyA_Yes: value === "1" ? 1 : 0,
                dypweoyA_No: value === "0" ? 1 : 0,
            }));
            return;
        }

        if (name === "dycF") {
            const value = val?.value?.toString() ?? "";
            setValues(prev => ({
                ...prev,
                dycF_Yes: value === "1" ? 1 : 0,
                dycF_No: value === "0" ? 1 : 0,
            }));
            return;
        }

        if (name === "hyeaS") {
            const value = val?.value?.toString() ?? "";
            setValues(prev => ({
                ...prev,
                hyeaS_Yes: value === "1" ? 1 : 0,
                hyeaS_No: value === "0" ? 1 : 0,
            }));
            return;
        }

        if (name === "hyestahY") {
            const value = val?.value?.toString() ?? "";
            setValues(prev => ({
                ...prev,
                hyestahY_Yes: value === "1" ? 1 : 0,
                hyestahY_No: value === "0" ? 1 : 0,
            }));
            return;
        }

        if (name === "dyhtS") {
            const value = val?.value?.toString() ?? "";
            setValues(prev => ({
                ...prev,
                dyhtS_Yes: value === "1" ? 1 : 0,
                dyhtS_No: value === "0" ? 1 : 0,
            }));
            return;
        }

        if (name === "hyebtoC") {
            const value = val?.value?.toString() ?? "";
            setValues(prev => ({
                ...prev,
                hyebtoC_Yes: value === "1" ? 1 : 0,
                hyebtoC_No: value === "0" ? 1 : 0,
            }));
            return;
        }

        setValues((prev) => ({
            ...prev,
            [name]: val,
        }));
    }


    const handleChange = (e) => {
        const { name, value } = e.target;
        setValues((val) => ({ ...val, [name]: value }));
    };
    const [tableData, setTableData] = useState([])
    const fetchListData = async () => {
        const res = await getNutritionAssessmentApi(patientID, transactionID)
        if (res?.success) {
            setTableData(res?.data)
        } else {
            setTableData([])
            notify(res?.message, "error")
        }
    }
    useEffect(() => {
        fetchListData()
    }, [])
    console.log(values);
    const THEAD = [
        { name: t("S.No"), width: "1%" },
        { name: t("PatientId"), width: "1%" },
        { name: t("TransationNo"), width: "1%" },
        { name: t("Created By"), width: "1%" },
        { name: t("Edit"), width: "1%" },
        // { name: t("Print"), width: "1%" },
    ]

    const getSelectOption = (value, options) => {
        return options.find(opt => opt.value === value) || null;
    };

    const isOne = (v) => v === 1 || v === "1";

    const getMaritalSelectValue = () => {
        if (isOne(values.single)) return "Single";
        if (isOne(values.partnered)) return "Partnered";
        if (isOne(values.married)) return "Married";
        if (isOne(values.separated)) return "Separated";
        if (isOne(values.divorced)) return "Divorced";
        if (isOne(values.widowed)) return "Widowed";
        return null;
    };
    const getRankSaltIntakeValue = () => {
        if (values.rankSaltIntake_Hi === 1) return { label: "High", value: "1" };
        if (values.rankSaltIntake_Med === 1) return { label: "Medium", value: "2" };
        if (values.rankSaltIntake_Low === 1) return { label: "Low", value: "3" };
        return null;
    };
    const handleEdit = (item) => {
        debugger

        setValues(prev => ({
            ...prev,
            // single: row?.single === "Single" ? 1 : 0,
            // partnered: row?.partnered === "Partnered" ? 1 : 0,
            // married: row?.married === "Married" ? 1 : 0,
            // separated: row?.separated === "Separated" ? 1 : 0,
            // divorced: row?.divorced === "Divorced" ? 1 : 0,
            // widowed: row?.widowed === "Widowed" ? 1 : 0,
            // dieting_Yes: row?.dieting_Yes === "1" ? 1 : 0,
            // dieting_No: row?.dieting_No === "0" ? 1 : 0,
            // phyPrescribed_Yes: row?.phyPrescribed_Yes === "1" ? 1 : 0,
            // phyPrescribed_No: row?.phyPrescribed_No === "0" ? 1 : 0,
            ...item,
        }));

    }
    console.log(values);

    const handlePrint = () => {

    }



    return (
        <div className='mt-2 spatient_registration_card'>
            <div className="patient_registration card">
                <Heading
                    title={t("PERSONAL HEALTH HISTORY")}
                    isBreadcrumb={false}
                />
                <div className='row p-2'>
                    <ReactSelect
                        placeholderName={t("Marital_Status")}
                        id="Marital_Status"
                        dynamicOptions={
                            [
                                { label: t("Single"), value: "Single" },
                                { label: t("Partnered"), value: "Partnered" },
                                { label: t("Married"), value: "Married" },
                                { label: t("Separated"), value: "Separated" },
                                { label: t("Divorced"), value: "Divorced" },
                                { label: t("Widowed"), value: "Widowed" },
                            ]
                        }
                        name="MaritalStatus"
                        // value={
                        //     values.single === 1 ? { label: "Single", value: "1" } :
                        //         values.partnered === 1 ? { label: "Partnered", value: "1" } :
                        //             values.married === 1 ? { label: "Married", value: "1" } :
                        //                 values.separated === 1 ? { label: "Separated", value: "1" } :
                        //                     values.divorced === 1 ? { label: "Divorced", value: "1" } :
                        //                         values.widowed === 1 ? { label: "Widowed", value: "1" } :
                        //                             null
                        // }
                        value={getMaritalSelectValue()}
                        handleChange={handleReactSelect}
                        searchable={true}
                        respclass="col-xl-2 col-md-4 col-sm-6 col-12"

                    />
                    <div className="col-12 col-sm-12 col-md-10">
                        <div
                            className="pt-3 pb-2 pr-2 pl-2 form-group"
                            style={{
                                border: "1px solid #ced4da",
                                borderRadius: "4px",
                                position: "relative",
                            }}
                        >
                            <label className="label" style={{ position: "absolute" }}>
                                {t("Childhood illness")}
                            </label>
                            <div className="row">
                                <ReactSelect
                                    placeholderName={t("Measles")}
                                    name="childhoodIllness_Measles"
                                    value={String(values?.childhoodIllness_Measles?.value ?? values?.childhoodIllness_Measles ?? 0)}
                                    handleChange={handleReactSelect}
                                    dynamicOptions={TRUE_FALSE_OPTIONS}
                                    searchable={false}
                                    id="Measles"
                                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                    removeIsClearable={true}
                                />
                                <Input
                                    type="text"
                                    className="form-control"
                                    id="measles_T"
                                    name="measles_T"
                                    value={values?.measles_T}
                                    onChange={handleChange}
                                    lable={t("measles Text")}
                                    respclass="col-sm-6  col-md-2 col-12"
                                    placeholder=""
                                />
                                <ReactSelect
                                    placeholderName={t("Mumps")}
                                    name="childhoodIllness_Mumps"
                                    value={String(values?.childhoodIllness_Mumps.value ?? values?.childhoodIllness_Mumps ?? 0)}
                                    handleChange={handleReactSelect}
                                    dynamicOptions={TRUE_FALSE_OPTIONS}
                                    searchable={false}
                                    id="Mumps"
                                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                    removeIsClearable={true}
                                />
                                <Input
                                    type="text"
                                    className="form-control"
                                    id="mumps_T"
                                    name="mumps_T"
                                    value={values?.mumps_T}
                                    onChange={handleChange}
                                    lable={t("mumps Text")}
                                    respclass="col-sm-6  col-md-2 col-12"
                                    placeholder=""
                                />
                                <ReactSelect
                                    placeholderName={t("Rubella")}
                                    name="childhoodIllness_Rubella"
                                    value={String(values?.childhoodIllness_Rubella?.value ?? values?.childhoodIllness_Rubella ?? 0)}
                                    handleChange={handleReactSelect}
                                    dynamicOptions={TRUE_FALSE_OPTIONS}
                                    searchable={false}
                                    id="Rubella"
                                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                    removeIsClearable={true}
                                />
                                <Input
                                    type="text"
                                    className="form-control"
                                    id="rubella_T"
                                    name="rubella_T"
                                    value={values?.rubella_T}
                                    onChange={handleChange}
                                    lable={t("rubella Text")}
                                    respclass="col-sm-6  col-md-2 col-12"
                                    placeholder=""
                                />
                                <ReactSelect
                                    placeholderName={t("Chickenpox")}
                                    name="childhoodIllness_Chickenpox"
                                    value={String(values?.childhoodIllness_Chickenpox?.value ?? values?.childhoodIllness_Chickenpox ?? 0)}
                                    handleChange={handleReactSelect}
                                    dynamicOptions={TRUE_FALSE_OPTIONS}
                                    searchable={false}
                                    id="Chickenpox"
                                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                    removeIsClearable={true}
                                />
                                <Input
                                    type="text"
                                    className="form-control"
                                    id="chickenpox_T"
                                    name="chickenpox_T"
                                    value={values?.chickenpox_T}
                                    onChange={handleChange}
                                    lable={t("chickenpox Text")}
                                    respclass="col-sm-6  col-md-2 col-12"
                                    placeholder=""
                                />
                                <ReactSelect
                                    placeholderName={t("Rheumatic")}
                                    name="childhoodIllness_Rheumatic"
                                    value={String(values?.childhoodIllness_Rheumatic?.value ?? values?.childhoodIllness_Rheumatic ?? 0)}
                                    handleChange={handleReactSelect}
                                    dynamicOptions={TRUE_FALSE_OPTIONS}
                                    searchable={false}
                                    id="Rheumatic"
                                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                    removeIsClearable={true}
                                />
                                <Input
                                    type="text"
                                    className="form-control"
                                    id="rheumatic_T"
                                    name="rheumatic_T"
                                    value={values?.rheumatic_T}
                                    onChange={handleChange}
                                    lable={t("rheumatic Text")}
                                    respclass="col-sm-6  col-md-2 col-12"
                                    placeholder=""
                                />
                                <ReactSelect
                                    placeholderName={t("Polio")}
                                    name="childhoodIllness_Polio"
                                    value={String(values?.childhoodIllness_Polio?.value ?? values?.childhoodIllness_Polio ?? 0)}
                                    handleChange={handleReactSelect}
                                    dynamicOptions={TRUE_FALSE_OPTIONS}
                                    searchable={false}
                                    id="Polio"
                                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                    removeIsClearable={true}
                                />
                                <Input
                                    type="text"
                                    className="form-control"
                                    id="polio_T"
                                    name="polio_T"
                                    value={values?.polio_T}
                                    onChange={handleChange}
                                    lable={t("polio Text")}
                                    respclass="col-sm-6  col-md-2 col-12"
                                    placeholder=""
                                />
                            </div>
                        </div>
                    </div>

                    <div className="col-12 col-sm-12 col-md-12">
                        <div
                            className="pt-3 pb-2 pr-2 pl-2 form-group"
                            style={{
                                border: "1px solid #ced4da",
                                borderRadius: "4px",
                                position: "relative",
                            }}
                        >
                            <label className="label" style={{ position: "absolute" }}>
                                {t("Immunizations and dates")}
                            </label>
                            <div className="row">
                                <ReactSelect
                                    placeholderName={t("Tetanus")}
                                    name="immunizations_Tetanus"
                                    value={String(values?.immunizations_Tetanus?.value ?? values?.immunizations_Tetanus ?? 0)}
                                    handleChange={handleReactSelect}
                                    dynamicOptions={TRUE_FALSE_OPTIONS}
                                    searchable={false}
                                    id="Tetanus"
                                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                    removeIsClearable={true}
                                />
                                <Input
                                    type="text"
                                    className="form-control"
                                    id="tetanus_T"
                                    name="tetanus_T"
                                    value={values?.tetanus_T}
                                    onChange={handleChange}
                                    lable={t("tetanus Text")}
                                    respclass="col-sm-6  col-md-2 col-12"
                                    placeholder=""
                                />
                                <ReactSelect
                                    placeholderName={t("Pneumonia")}
                                    name="immunizations_Pneumonia"
                                    value={String(values?.immunizations_Pneumonia?.value ?? values?.immunizations_Pneumonia ?? 0)}
                                    handleChange={handleReactSelect}
                                    dynamicOptions={TRUE_FALSE_OPTIONS}
                                    searchable={false}
                                    id="Pneumonia"
                                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                    removeIsClearable={true}
                                />
                                <Input
                                    type="text"
                                    className="form-control"
                                    id="pneumonia_T"
                                    name="pneumonia_T"
                                    value={values?.pneumonia_T}
                                    onChange={handleChange}
                                    lable={t("pneumonia Text")}
                                    respclass="col-sm-6  col-md-2 col-12"
                                    placeholder=""
                                />
                                <ReactSelect
                                    placeholderName={t("Hepatitis")}
                                    name="immunizations_Hepatitis"
                                    value={String(values?.immunizations_Hepatitis?.value ?? values?.immunizations_Hepatitis ?? 0)}
                                    handleChange={handleReactSelect}
                                    dynamicOptions={TRUE_FALSE_OPTIONS}
                                    searchable={false}
                                    id="Hepatitis"
                                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                    removeIsClearable={true}
                                />
                                <Input
                                    type="text"
                                    className="form-control"
                                    id="hepatitis_T"
                                    name="hepatitis_T"
                                    value={values?.hepatitis_T}
                                    onChange={handleChange}
                                    lable={t("hepatitis Text")}
                                    respclass="col-sm-6  col-md-2 col-12"
                                    placeholder=""
                                />
                                <ReactSelect
                                    placeholderName={t("Chickenpox")}
                                    name="immunizations_Chickenpox"
                                    value={String(values?.immunizations_Chickenpox?.value ?? values?.immunizations_Chickenpox ?? 0)}
                                    handleChange={handleReactSelect}
                                    dynamicOptions={TRUE_FALSE_OPTIONS}
                                    searchable={false}
                                    id="Chickenpox"
                                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                    removeIsClearable={true}
                                />

                                <Input
                                    type="text"
                                    className="form-control"
                                    id="chickenpox1_T"
                                    name="chickenpox1_T"
                                    value={values?.chickenpox1_T}
                                    onChange={handleChange}
                                    lable={t("chickenpox Text")}
                                    respclass="col-sm-6  col-md-2 col-12"
                                    placeholder=""
                                />
                                <ReactSelect
                                    placeholderName={t("Influenza")}
                                    name="immunizations_Influenza"
                                    value={String(values?.immunizations_Influenza?.value ?? values?.immunizations_Influenza ?? 0)}
                                    handleChange={handleReactSelect}
                                    dynamicOptions={TRUE_FALSE_OPTIONS}
                                    searchable={false}
                                    id="Influenza"
                                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                    removeIsClearable={true}
                                />
                                <Input
                                    type="text"
                                    className="form-control"
                                    id="influenza_T"
                                    name="influenza_T"
                                    value={values?.influenza_T}
                                    onChange={handleChange}
                                    lable={t("influenza Text")}
                                    respclass="col-sm-6  col-md-2 col-12"
                                    placeholder=""
                                />
                                <ReactSelect
                                    placeholderName={t("MMR")}
                                    name="immunizations_MMR"
                                    value={String(values?.immunizations_MMR?.value ?? values?.immunizations_MMR ?? 0)}
                                    handleChange={handleReactSelect}
                                    dynamicOptions={TRUE_FALSE_OPTIONS}
                                    searchable={false}
                                    id="MMR"
                                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                    removeIsClearable={true}
                                />
                                <Input
                                    type="text"
                                    className="form-control"
                                    id="mmR_T"
                                    name="mmR_T"
                                    value={values?.mmR_T}
                                    onChange={handleChange}
                                    lable={t("MMR Text")}
                                    respclass="col-sm-6  col-md-2 col-12"
                                    placeholder=""
                                />
                            </div>
                        </div>
                    </div>
                    <TextAreaInput
                        type="text"
                        className={`form-textarea `}
                        id="listMedProblem"
                        name="listMedProblem"
                        value={values?.listMedProblem ? values?.listMedProblem : ""}
                        onChange={handleChange}
                        lable={t("List any medical problems that other doctors have diagnosed")}
                        placeholder=" "
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                    />
                    <Input
                        type="text"
                        className="form-control"
                        id="surgeries_Year"
                        name="surgeries_Year"
                        value={values?.surgeries_Year}
                        onChange={handleChange}
                        lable={t("surgeries Year")}
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                        placeholder=""
                    />
                    <Input
                        type="text"
                        className="form-control"
                        id="surgeries_Reason"
                        name="surgeries_Reason"
                        value={values?.surgeries_Reason}
                        onChange={handleChange}
                        lable={t("surgeries Reason")}
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                        placeholder=""
                    />
                    <Input
                        type="text"
                        className="form-control"
                        id="surgeries_Hospital"
                        name="surgeries_Hospital"
                        value={values?.surgeries_Hospital}
                        onChange={handleChange}
                        lable={t("surgeries Hospital")}
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                        placeholder=""
                    />
                    <Input
                        type="text"
                        className="form-control"
                        id="otherHospitalization_Year"
                        name="otherHospitalization_Year"
                        value={values?.otherHospitalization_Year}
                        onChange={handleChange}
                        lable={t("other Hospitalization Year")}
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                        placeholder=""
                    />
                    <Input
                        type="text"
                        className="form-control"
                        id="otherHospitalization_Reason"
                        name="otherHospitalization_Reason"
                        value={values?.otherHospitalization_Reason}
                        onChange={handleChange}
                        lable={t("other Hospitalization Reason")}
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                        placeholder=""
                    />
                    <Input
                        type="text"
                        className="form-control"
                        id="otherHospitalization_Hospital"
                        name="otherHospitalization_Hospital"
                        value={values?.otherHospitalization_Hospital}
                        onChange={handleChange}
                        lable={t("other Hospitalization Hospital")}
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                        placeholder=""
                    />
                    <Input
                        type="text"
                        className="form-control"
                        id="prescribedDrugs_Name"
                        name="prescribedDrugs_Name"
                        value={values?.prescribedDrugs_Name}
                        onChange={handleChange}
                        lable={t("prescribed Drugs Name")}
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                        placeholder=""
                    />
                    <Input
                        type="text"
                        className="form-control"
                        id="prescribedDrugs_Strength"
                        name="prescribedDrugs_Strength"
                        value={values?.prescribedDrugs_Strength}
                        onChange={handleChange}
                        lable={t("prescribed Drugs Strength")}
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                        placeholder=""
                    />
                    <Input
                        type="text"
                        className="form-control"
                        id="prescribedDrugs_Frequency"
                        name="prescribedDrugs_Frequency"
                        value={values?.prescribedDrugs_Frequency}
                        onChange={handleChange}
                        lable={t("prescribed Drugs Frequency")}
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                        placeholder=""
                    />

                </div>
                <Heading title={t("HEALTH HABITS AND PERSONAL SAFETY")} />
                <div className='row p-2'>
                    <div className="col-12 col-sm-12 col-md-12">
                        <div
                            className="pt-3 pb-2 pr-2 pl-2 form-group"
                            style={{
                                border: "1px solid #ced4da",
                                borderRadius: "4px",
                                position: "relative",
                            }}
                        >
                            <label className="label" style={{ position: "absolute" }}>
                                {t("Immunizations and dates")}
                            </label>
                            <div className="row">

                                <ReactSelect
                                    placeholderName={t("exercise Sedentary")}
                                    name="exercise_Sedentary"
                                    value={String(values?.exercise_Sedentary?.value ?? values?.exercise_Sedentary ?? 0)}
                                    handleChange={handleReactSelect}
                                    dynamicOptions={TRUE_FALSE_OPTIONS}
                                    searchable={false}
                                    id="exercise_Sedentary"
                                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                    removeIsClearable={true}
                                />
                                <Input
                                    type="text"
                                    className="form-control"
                                    id="sedentary_T"
                                    name="sedentary_T"
                                    value={values?.sedentary_T || ""}
                                    onChange={handleChange}
                                    lable={t("exercise Sedentary Text")}
                                    placeholder=" "
                                    respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                                />

                                <ReactSelect
                                    placeholderName={t("exercise Mild")}
                                    name="exercise_Mild"
                                    value={String(values?.exercise_Mild?.value ?? values?.exercise_Mild ?? 0)}
                                    handleChange={handleReactSelect}
                                    dynamicOptions={TRUE_FALSE_OPTIONS}
                                    searchable={false}
                                    id="exercise_Mild"
                                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                    removeIsClearable={true}
                                />
                                <Input
                                    type="text"
                                    className="form-control"
                                    id="mildExercise_T"
                                    name="mildExercise_T"
                                    value={values?.mildExercise_T || ""}
                                    onChange={handleChange}
                                    lable={t("exercise Mild Text")}
                                    placeholder=" "
                                    respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                                />
                                <ReactSelect
                                    placeholderName={t("exercise Occasional Vigorous")}
                                    name="exercise_OccasionalVigorous"
                                    value={String(values?.exercise_OccasionalVigorous?.value ?? values?.exercise_OccasionalVigorous ?? 0)}
                                    handleChange={handleReactSelect}
                                    dynamicOptions={TRUE_FALSE_OPTIONS}
                                    searchable={false}
                                    id="exercise_OccasionalVigorous"
                                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                    removeIsClearable={true}
                                />
                                <Input
                                    type="text"
                                    className="form-control"
                                    id="occasionalvigorous_T"
                                    name="occasionalvigorous_T"
                                    value={values?.occasionalvigorous_T || ""}
                                    onChange={handleChange}
                                    lable={t("Occasional vigorous exercise")}
                                    placeholder=" "
                                    respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                                />
                                <ReactSelect
                                    placeholderName={t("exercise Regular Vigorous")}
                                    name="exercise_RegularVigorous"
                                    value={String(values?.exercise_RegularVigorous?.value ?? values?.exercise_RegularVigorous ?? 0)}
                                    handleChange={handleReactSelect}
                                    dynamicOptions={TRUE_FALSE_OPTIONS}
                                    searchable={false}
                                    id="exercise_RegularVigorous"
                                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                    removeIsClearable={true}
                                />
                                <Input
                                    type="text"
                                    className="form-control"
                                    id="regularvigorous_T"
                                    name="regularvigorous_T"
                                    value={values?.regularvigorous_T || ""}
                                    onChange={handleChange}
                                    lable={t("Regular vigorous exercise")}
                                    placeholder=" "
                                    respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                                />

                                <ReactSelect
                                    placeholderName={t("Are you dieting")}
                                    name="dieting"
                                    value={
                                        values?.dieting_Yes === 1
                                            ? "1"
                                            : values?.dieting_No === 1
                                                ? "0"
                                                : "0"
                                    }
                                    handleChange={handleReactSelect}

                                    dynamicOptions={[
                                        { label: t("Yes"), value: "1" },
                                        { label: t("No"), value: "0" },
                                    ]}
                                    searchable={false}
                                    id="dieting"
                                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                    removeIsClearable={true}
                                />
                                <Input
                                    type="text"
                                    className="form-control"
                                    id="ayD_T"
                                    name="ayD_T"
                                    value={values?.ayD_T || ""}
                                    onChange={handleChange}
                                    lable={t("Are you dieting")}
                                    placeholder=" "
                                    respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                                />

                                <ReactSelect
                                    placeholderName={t("physician prescribed Medicine")}
                                    name="phyPrescribed"
                                    value={
                                        values?.phyPrescribed_Yes === 1
                                            ? "1"
                                            : values?.phyPrescribed_No === 1
                                                ? "0"
                                                : "0"
                                    }
                                    handleChange={handleReactSelect}
                                    dynamicOptions={TRUE_FALSE_OPTIONS}
                                    searchable={false}
                                    id="phyPrescribed"
                                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                    removeIsClearable={true}
                                />
                                <Input
                                    type="text"
                                    className="form-control"
                                    id="phyprescribed_T"
                                    name="phyprescribed_T"
                                    value={values?.phyprescribed_T || ""}
                                    onChange={handleChange}
                                    lable={t("physician prescribed Medicine")}
                                    placeholder=" "
                                    respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                                />
                            </div>
                        </div>
                    </div>

                    <Input
                        type="text"
                        className="form-control"
                        id="mealYouEat"
                        name="mealYouEat"
                        value={values?.mealYouEat || ""}
                        onChange={handleChange}
                        lable={t("meal You Eat")}
                        placeholder=" "
                        respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                    />
                    <ReactSelect
                        placeholderName={t("Rank salt intake")}
                        name="rankSaltIntake"
                        value={values.rankSaltIntake_Hi === 1
                            ? "1"
                            : values.rankSaltIntake_Med === 1
                                ? "2"
                                : values.rankSaltIntake_Low === 1
                                    ? "3"
                                    : "0"}
                        handleChange={handleReactSelect}
                        dynamicOptions={RankOPTIONS}
                        // searchable={false}
                        id="rankSaltIntake"
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                        removeIsClearable={true}
                    />
                    <ReactSelect
                        placeholderName={t("Rank salt intake")}
                        name="rankFatIntake"
                        value={values.rankFatIntake_Hi === 1
                            ? "1"
                            : values.rankFatIntake_Med === 1
                                ? "2"
                                : values.rankFatIntake_Low === 1
                                    ? "3"
                                    : "0"}
                        handleChange={handleReactSelect}
                        dynamicOptions={RankOPTIONS}
                        id="rankSaltIntake"
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                        removeIsClearable={true}
                    />

                    <ReactSelect
                        placeholderName={t("Caffeine")}
                        name="Caffeine"
                        value={values.caffeine_None === 1
                            ? "1"
                            : values.caffeine_Coffee === 1
                                ? "2"
                                : values.caffeine_Tea === 1
                                    ? "3"
                                    : values.caffeine_Cola === 1
                                        ? "4"
                                        : "0"}
                        handleChange={handleReactSelect}
                        dynamicOptions={CoffineOPTIONS}
                        // searchable={false}
                        id="Caffeine"
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                        removeIsClearable={true}
                    />
                    <Input
                        type="text"
                        className="form-control"
                        id="cupsPerDay"
                        name="cupsPerDay"
                        value={values?.cupsPerDay || ""}
                        onChange={handleChange}
                        lable={t("cups Per Day")}
                        placeholder=" "
                        respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                    />
                    <ReactSelect
                        placeholderName={t("alcohol")}
                        name="alcohol"
                        value={
                            values?.alcohol_Drink === 1
                                ? "1"
                                : values?.alcohol_Drink_No === 1
                                    ? "0"
                                    : "0"
                        }
                        handleChange={handleReactSelect}
                        dynamicOptions={[
                            { label: t("Yes"), value: "1" },
                            { label: t("No"), value: "0" },
                        ]}
                        searchable={false}
                        id="alcohol"
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                        removeIsClearable={true}
                    />

                    <Input
                        type="text"
                        className="form-control"
                        id="alcohol_Type"
                        name="alcohol_Type"
                        value={values?.alcohol_Type || ""}
                        onChange={handleChange}
                        lable={t("alcohol Type")}
                        placeholder=" "
                        respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                    />
                    <Input
                        type="text"
                        className="form-control"
                        id="alcohol_DrinksPerWeek"
                        name="alcohol_DrinksPerWeek"
                        value={values?.alcohol_DrinksPerWeek || ""}
                        onChange={handleChange}
                        lable={t("alcohol Drinks Per Week")}
                        placeholder=" "
                        respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                    />
                    <Input
                        type="text"
                        className="form-control"
                        id="amtyoudrink_T"
                        name="amtyoudrink_T"
                        value={values?.amtyoudrink_T || ""}
                        onChange={handleChange}
                        lable={t("amt you drink")}
                        placeholder=" "
                        respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                    />

                    <ReactSelect
                        placeholderName={t("Are you concerned about the amount you drink")}
                        name="Considered"
                        value={
                            values?.alcohol_Concerned_Yes === 1
                                ? "1"
                                : values?.alcohol_Concerned_No === 1
                                    ? "0"
                                    : null
                        }
                        handleChange={handleReactSelect}
                        dynamicOptions={[
                            { label: t("Yes"), value: "1" },
                            { label: t("No"), value: "0" },
                        ]}
                        searchable={false}
                        id="Considered"
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                        removeIsClearable={true}
                    />

                    <Input
                        type="text"
                        className="form-control"
                        id="consiStop_T"
                        name="consiStop_T"
                        value={values?.consiStop_T || ""}
                        onChange={handleChange}
                        lable={t("Have you considered stopping")}
                        placeholder=" "
                        respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                    />
                    <ReactSelect
                        placeholderName={t("Have you considered stopping")}
                        name="ConsideredStop"
                        value={
                            String(values?.alcohol_ConsideredStop_Yes === 1
                                ? "1"
                                : values?.alcohol_ConsideredStop_No === 1
                                    ? "0"
                                    : null)
                        }
                        handleChange={handleReactSelect}
                        dynamicOptions={[
                            { label: t("Yes"), value: "1" },
                            { label: t("No"), value: "0" },
                        ]}
                        searchable={false}
                        id="ConsideredStop"
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                        removeIsClearable={true}
                    />
                    <Input
                        type="text"
                        className="form-control"
                        id="hyeeB_T"
                        name="hyeeB_T"
                        value={values?.hyeeB_T || ""}
                        onChange={handleChange}
                        lable={t("Have you ever experienced blackouts")}
                        placeholder=" "
                        respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                    />
                    <ReactSelect
                        placeholderName={t("experienced blackouts")}
                        name="alcohol_Blackouts"
                        value={
                            values?.alcohol_Blackouts_Yes === 1
                                ? "1"
                                : values?.alcohol_Blackouts_No === 1
                                    ? "0"
                                    : null
                        }
                        handleChange={handleReactSelect}
                        dynamicOptions={[
                            { label: t("Yes"), value: "1" },
                            { label: t("No"), value: "0" },
                        ]}
                        searchable={false}
                        id="alcohol_Blackouts"
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                        removeIsClearable={true}
                    />
                    <Input
                        type="text"
                        className="form-control"
                        id="ayptbD_T"
                        name="ayptbD_T"
                        value={values?.ayptbD_T || ""}
                        onChange={handleChange}
                        lable={t("Are you prone to binge drinking")}
                        placeholder=" "
                        respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                    />
                    <ReactSelect
                        placeholderName={t("alcohol Binge")}
                        name="alcohol_Binge"
                        value={
                            values?.alcohol_Binge_Yes === 1
                                ? "1"
                                : values?.alcohol_Binge_No === 1
                                    ? "0"
                                    : null
                        }
                        handleChange={handleReactSelect}
                        dynamicOptions={[
                            { label: t("Yes"), value: "1" },
                            { label: t("No"), value: "0" },
                        ]}
                        searchable={false}
                        id="alcohol_Binge"
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                        removeIsClearable={true}
                    />

                    <Input
                        type="text"
                        className="form-control"
                        id="dyuT_T"
                        name="dyuT_T"
                        value={values?.dyuT_T || ""}
                        onChange={handleChange}
                        lable={t("Do you use tobacco")}
                        placeholder=" "
                        respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                    />
                    <ReactSelect
                        placeholderName={t("Do you use tobacco")}
                        name="tobacco_Use"
                        value={
                            values?.tobacco_Use_Yes === 1
                                ? "1"
                                : values?.tobacco_Use_No === 1
                                    ? "0"
                                    : null
                        }
                        handleChange={handleReactSelect}
                        dynamicOptions={[
                            { label: t("Yes"), value: "1" },
                            { label: t("No"), value: "0" },
                        ]}
                        searchable={false}
                        id="tobacco_Use"
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                        removeIsClearable={true}
                    />

                    <div className="col-12 col-sm-12 col-md-12">
                        <div
                            className="pt-3 pb-2 pr-2 pl-2 form-group"
                            style={{
                                border: "1px solid #ced4da",
                                borderRadius: "4px",
                                position: "relative",
                            }}
                        >
                            <label className="label" style={{ position: "absolute" }}>
                                {t("Tobacco")}
                            </label>
                            <div className="row">
                                <ReactSelect
                                    placeholderName={t("tobacco_Cigarettes")}
                                    name="tobacco_Cigarettes"
                                    value={String(values?.tobacco_Cigarettes ? values?.tobacco_Cigarettes : 0)}
                                    handleChange={handleReactSelect}
                                    dynamicOptions={TRUE_FALSE_OPTIONS}
                                    searchable={false}
                                    id="tobacco Cigarettes"
                                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                    removeIsClearable={true}
                                />
                                <Input
                                    type="text"
                                    className="form-control"
                                    id="cigarettes_T"
                                    name="cigarettes_T"
                                    value={values?.cigarettes_T}
                                    onChange={handleChange}
                                    lable={t("cigarettes Text")}
                                    respclass="col-sm-6  col-md-2 col-12"
                                    placeholder=""
                                />
                                <ReactSelect
                                    placeholderName={t("tobacco Chew")}
                                    name="tobacco_Chew"
                                    value={values?.tobacco_Chew ? values?.tobacco_Chew : "0"}
                                    handleChange={handleReactSelect}
                                    dynamicOptions={TRUE_FALSE_OPTIONS}
                                    searchable={false}
                                    id="tobacco_Chew"
                                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                    removeIsClearable={true}
                                />
                                <Input
                                    type="text"
                                    className="form-control"
                                    id="chew_T"
                                    name="chew_T"
                                    value={values?.chew_T}
                                    onChange={handleChange}
                                    lable={t("chew Text")}
                                    respclass="col-sm-6  col-md-2 col-12"
                                    placeholder=""
                                />
                                <ReactSelect
                                    placeholderName={t("tobacco Pipe")}
                                    name="tobacco_Pipe"
                                    value={values?.tobacco_Pipe ? values?.tobacco_Pipe : "0"}
                                    handleChange={handleReactSelect}
                                    dynamicOptions={TRUE_FALSE_OPTIONS}
                                    searchable={false}
                                    id="tobacco_Pipe"
                                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                    removeIsClearable={true}
                                />
                                <Input
                                    type="text"
                                    className="form-control"
                                    id="pipe_T"
                                    name="pipe_T"
                                    value={values?.pipe_T}
                                    onChange={handleChange}
                                    lable={t("pipe Text")}
                                    respclass="col-sm-6  col-md-2 col-12"
                                    placeholder=""
                                />
                                <ReactSelect
                                    placeholderName={t("tobacco Cigars")}
                                    name="tobacco_Cigars"
                                    value={values?.tobacco_Cigars ? values?.tobacco_Cigars : "0"}
                                    handleChange={handleReactSelect}
                                    dynamicOptions={TRUE_FALSE_OPTIONS}
                                    searchable={false}
                                    id="tobacco_Cigars"
                                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                    removeIsClearable={true}
                                />

                                <Input
                                    type="text"
                                    className="form-control"
                                    id="cigars_T"
                                    name="cigars_T"
                                    value={values?.cigars_T}
                                    onChange={handleChange}
                                    lable={t("cigars Text")}
                                    respclass="col-sm-6  col-md-2 col-12"
                                    placeholder=""
                                />
                                <ReactSelect
                                    placeholderName={t("tobacco Years")}
                                    name="tobacco_Years"
                                    value={values?.tobacco_Years ? values?.tobacco_Years : "0"}
                                    handleChange={handleReactSelect}
                                    dynamicOptions={TRUE_FALSE_OPTIONS}
                                    searchable={false}
                                    id="tobacco_Years"
                                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                    removeIsClearable={true}
                                />
                                <Input
                                    type="text"
                                    className="form-control"
                                    id="ofyear_T"
                                    name="ofyear_T"
                                    value={values?.ofyear_T}
                                    onChange={handleChange}
                                    lable={t("year Text")}
                                    respclass="col-sm-6  col-md-2 col-12"
                                    placeholder=""
                                />
                                <ReactSelect
                                    placeholderName={t("tobacco Year Quit")}
                                    name="tobacco_YearQuit"
                                    value={values?.tobacco_YearQuit ? values?.tobacco_YearQuit : "0"}
                                    handleChange={handleReactSelect}
                                    dynamicOptions={TRUE_FALSE_OPTIONS}
                                    searchable={false}
                                    id="tobacco_YearQuit"
                                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                    removeIsClearable={true}
                                />
                                <Input
                                    type="text"
                                    className="form-control"
                                    id="yearQuit_T"
                                    name="yearQuit_T"
                                    value={values?.yearQuit_T}
                                    onChange={handleChange}
                                    lable={t("year Quit")}
                                    respclass="col-sm-6  col-md-2 col-12"
                                    placeholder=""
                                />
                            </div>
                        </div>
                    </div>

                    <Input
                        type="text"
                        className="form-control"
                        name="dycuroStreetDrug_T"
                        value={values.dycuroStreetDrug_T || ""}
                        onChange={handleText}
                        placeholder=""
                        id="dycuroStreetDrug_T"
                        lable={t("Do you currently use recreational or street drugs")}
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                    />

                    <ReactSelect
                        placeholderName={"Do you currently use recreational or street drugs?"}
                        name="streetDrugs_Use"
                        value={
                            values.streetDrugs_UseY === 1
                                ? "1"
                                : values.streetDrugs_UseN === 1
                                    ? "0"
                                    : null
                        }
                        dynamicOptions={[
                            { label: t("Yes"), value: "1" },
                            { label: t("No"), value: "0" }
                        ]}
                        handleChange={handleReactSelect}
                        searchable={false}
                        removeIsClearable
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                    />
                    <Input
                        type="text"
                        className="form-control"
                        name="hyefysdwNeedle_T"
                        value={values.hyefysdwNeedle_T || ""}
                        onChange={handleText}
                        placeholder=""
                        id="hyefysdwNeedle_T"
                        lable={t("Have you ever given yourself street drugs with a needle")}
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                    />
                    <ReactSelect
                        name="hyefysdwNeedle"
                        value={
                            values.hyefysdwNeedle_Yes === 1
                                ? "1"
                                : values.hyefysdwNeedle_No === 1
                                    ? "0"
                                    : null
                        }
                        dynamicOptions={[{ label: t("Yes"), value: "1" }, { label: t("No"), value: "0" }]}
                        handleChange={handleYesNoSelect}
                        searchable={false}
                        removeIsClearable
                        placeholderName={t("Have you ever given yourself street drugs with a needle")}
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                    />
                    <Input
                        type="text"
                        className="form-control"
                        name="dylA_T"
                        id="dylA_T"
                        value={values.dylA_T || ""}
                        onChange={handleText}
                        lable={t("Do you live alone")}
                        placeholder=""
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                    />
                    <ReactSelect
                        name="dylA"
                        value={
                            values.dylA_Y === 1
                                ? "1"
                                : values.dylA_N === 1
                                    ? "0"
                                    : null
                        }
                        dynamicOptions={[
                            { label: t("Yes"), value: "1" },
                            { label: t("No"), value: "0" }
                        ]}
                        placeholderName={t("Do you live alone")}
                        handleChange={handleReactSelect}
                        searchable={false}
                        removeIsClearable
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"

                    />
                    <Input
                        type="text"
                        className="form-control"
                        name="dyhfF_T"
                        id="dyhfF_T"
                        value={values.dyhfF_T || ""}
                        onChange={handleText}
                        lable={t("Do you have frequent falls")}
                        placeholder=""
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                    />
                    <ReactSelect
                        name="dyhfF"
                        value={
                            values.dyhfF_Y === 1
                                ? "1"
                                : values.dyhfF_N === 1
                                    ? "0"
                                    : null
                        }
                        dynamicOptions={[
                            { label: t("Yes"), value: "1" },
                            { label: t("No"), value: "0" }
                        ]}
                        placeholderName={t("Select Gender")}
                        handleChange={handleReactSelect}
                        searchable={false}
                        removeIsClearable
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                    />
                    <Input
                        type="text"
                        className="form-control"
                        name="dyhvohL_T"
                        id="dyhvohL_T"
                        value={values.dyhvohL_T || ""}
                        onChange={handleText}
                        lable={t("Do you have vision or hearing loss")}
                        placeholder=""
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                    />
                    <ReactSelect
                        name="dyhvohL"
                        value={
                            values.dyhvohL_Y === 1
                                ? "1"
                                : values.dyhvohL_N === 1
                                    ? "0"
                                    : null
                        }
                        dynamicOptions={[
                            { label: t("Yes"), value: "1" },
                            { label: t("No"), value: "0" }
                        ]}
                        placeholderName={t("Do you have vision or hearing loss")}
                        handleChange={handleReactSelect}
                        searchable={false}
                        removeIsClearable
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                    />
                    <Input
                        type="text"
                        className="form-control"
                        name="dydaD_T"
                        id="dydaD_T"
                        value={values.dydaD_T || ""}
                        onChange={handleText}
                        lable={t("Do you Drive After Drinking")}
                        placeholder=""
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                    />
                    <ReactSelect
                        name="dydaD"
                        value={
                            values.dydaD_Y === 1
                                ? "1"
                                : values.dydaD_N === 1
                                    ? "0"
                                    : null
                        }
                        dynamicOptions={[
                            { label: t("Yes"), value: "1" },
                            { label: t("No"), value: "0" }
                        ]}
                        placeholderName={t("Do you Drive After Drinking")}
                        handleChange={handleReactSelect}
                        searchable={false}
                        removeIsClearable
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                    />
                </div>
                <Heading title={t("FAMILY HEALTH HISTORY")} />
                <div className='row p-2'>
                    <Input
                        type="text"
                        className="form-control"
                        id="f_Age"
                        name="f_Age"
                        value={values?.f_Age}
                        onChange={handleChange}
                        lable={t("Fater Age")}
                        respclass="col-sm-6  col-md-2 col-12"
                        placeholder=""
                    />
                    <Input
                        type="text"
                        className="form-control"
                        id="f_SHP"
                        name="f_SHP"
                        value={values?.f_SHP}
                        onChange={handleChange}
                        lable={t("Significant Health Problems")}
                        respclass="col-sm-6  col-md-2 col-12"
                        placeholder=""
                    />
                    <Input
                        type="text"
                        className="form-control"
                        id="m_Age"
                        name="m_Age"
                        value={values?.m_Age}
                        onChange={handleChange}
                        lable={t("Mother Age")}
                        respclass="col-sm-6  col-md-2 col-12"
                        placeholder=""
                    />
                    <Input
                        type="text"
                        className="form-control"
                        id="m_SHP"
                        name="m_SHP"
                        value={values?.m_SHP}
                        onChange={handleChange}
                        lable={t("Mother Significant Health Problems")}
                        respclass="col-sm-6  col-md-2 col-12"
                        placeholder=""
                    />

                    <div className="col-12 col-sm-12 col-md-12">
                        <div
                            className="pt-3 pb-2 pr-2 pl-2 form-group"
                            style={{
                                border: "1px solid #ced4da",
                                borderRadius: "4px",
                                position: "relative",
                            }}
                        >
                            <label className="label" style={{ position: "absolute" }}>
                                {t("Siblings")}
                            </label>
                            <div className="row">



                                <Input
                                    type="text"
                                    className="form-control"
                                    id="s_M1Age_T"
                                    name="s_M1Age_T"
                                    value={values?.s_M1Age_T}
                                    onChange={handleChange}
                                    lable={t("Siblings Age1")}
                                    respclass="col-sm-6  col-md-2 col-12"
                                    placeholder=""
                                />
                                <ReactSelect
                                    name="s1_M1"
                                    value={
                                        values.s_M1 === 1
                                            ? "1"
                                            : values.s_F1 === 1
                                                ? "0"
                                                : null
                                    }
                                    dynamicOptions={[
                                        { label: "M", value: "1" },
                                        { label: "F", value: "0" }
                                    ]}
                                    placeholderName={t("Select Gender")}
                                    handleChange={handleReactSelect}

                                    removeIsClearable
                                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                />
                                <Input
                                    type="text"
                                    className="form-control"
                                    id="s_SHP1"
                                    name="s_SHP1"
                                    value={values?.s_SHP1}
                                    onChange={handleChange}
                                    lable={t("Significant Health Problems 1")}
                                    respclass="col-sm-6  col-md-2 col-12"
                                    placeholder=""
                                />
                                <Input
                                    type="text"
                                    className="form-control"
                                    id="s_M2Age_T"
                                    name="s_M2Age_T"
                                    value={values?.s_M2Age_T}
                                    onChange={handleChange}
                                    lable={t("Siblings Age2")}
                                    respclass="col-sm-6  col-md-2 col-12"
                                    placeholder=""
                                />
                                <ReactSelect
                                    name="s2_M2"
                                    value={
                                        values.s_M2 === 1
                                            ? "1"
                                            : values.s_F2 === 1
                                                ? "0"
                                                : null
                                    }
                                    dynamicOptions={[
                                        { label: "M", value: "1" },
                                        { label: "F", value: "0" }
                                    ]}
                                    placeholderName={t("Select Gender")}
                                    handleChange={handleReactSelect}

                                    removeIsClearable
                                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                />
                                <Input
                                    type="text"
                                    className="form-control"
                                    id="s_SHP2"
                                    name="s_SHP2"
                                    value={values?.s_SHP2}
                                    onChange={handleChange}
                                    lable={t("Significant Health Problems 2")}
                                    respclass="col-sm-6  col-md-2 col-12"
                                    placeholder=""
                                />
                                <Input
                                    type="text"
                                    className="form-control"
                                    id="s_M3Age_T"
                                    name="s_M3Age_T"
                                    value={values?.s_M3Age_T}
                                    onChange={handleChange}
                                    lable={t("Siblings Age3")}
                                    respclass="col-sm-6  col-md-2 col-12"
                                    placeholder=""
                                />
                                <ReactSelect
                                    name="s3_M3"
                                    value={
                                        values.s_M3 === 1
                                            ? "1"
                                            : values.s_F3 === 1
                                                ? "0"
                                                : null
                                    }
                                    dynamicOptions={[
                                        { label: "M", value: "1" },
                                        { label: "F", value: "0" }
                                    ]}
                                    placeholderName={t("Select Gender")}
                                    handleChange={handleReactSelect}

                                    removeIsClearable
                                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                />
                                <Input
                                    type="text"
                                    className="form-control"
                                    id="s_SHP3"
                                    name="s_SHP3"
                                    value={values?.s_SHP3}
                                    onChange={handleChange}
                                    lable={t("Significant Health Problems 3")}
                                    respclass="col-sm-6  col-md-2 col-12"
                                    placeholder=""
                                />
                                <Input
                                    type="text"
                                    className="form-control"
                                    id="s_M4Age_T"
                                    name="s_M4Age_T"
                                    value={values?.s_M4Age_T}
                                    onChange={handleChange}
                                    lable={t("Siblings Age4")}
                                    respclass="col-sm-6  col-md-2 col-12"
                                    placeholder=""
                                />
                                <ReactSelect
                                    name="s4_M4"
                                    value={
                                        values.s_M4 === 1
                                            ? "1"
                                            : values.s_F4 === 1
                                                ? "0"
                                                : null
                                    }
                                    dynamicOptions={[
                                        { label: "M", value: "1" },
                                        { label: "F", value: "0" }
                                    ]}
                                    placeholderName={t("Select Gender")}
                                    handleChange={handleReactSelect}

                                    removeIsClearable
                                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                />
                                <Input
                                    type="text"
                                    className="form-control"
                                    id="s_SHP4"
                                    name="s_SHP4"
                                    value={values?.s_SHP4}
                                    onChange={handleChange}
                                    lable={t("Significant Health Problems 4")}
                                    respclass="col-sm-6  col-md-2 col-12"
                                    placeholder=""
                                />
                                <Input
                                    type="text"
                                    className="form-control"
                                    id="s_M5Age_T"
                                    name="s_M5Age_T"
                                    value={values?.s_M5Age_T}
                                    onChange={handleChange}
                                    lable={t("Siblings Age5")}
                                    respclass="col-sm-6  col-md-2 col-12"
                                    placeholder=""
                                />
                                <ReactSelect
                                    name="s5_M5"
                                    value={
                                        values.s_M5 === 1
                                            ? "1"
                                            : values.s_F5 === 1
                                                ? "0"
                                                : null
                                    }
                                    dynamicOptions={[
                                        { label: "M", value: "1" },
                                        { label: "F", value: "0" }
                                    ]}
                                    placeholderName={t("Select Gender")}
                                    handleChange={handleReactSelect}

                                    removeIsClearable
                                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                />
                                <Input
                                    type="text"
                                    className="form-control"
                                    id="s_SHP5"
                                    name="s_SHP5"
                                    value={values?.s_SHP5}
                                    onChange={handleChange}
                                    lable={t("Significant Health Problems 5")}
                                    respclass="col-sm-6  col-md-2 col-12"
                                    placeholder=""
                                />
                                <Input
                                    type="text"
                                    className="form-control"
                                    id="s_M6Age_T"
                                    name="s_M6Age_T"
                                    value={values?.s_M6Age_T}
                                    onChange={handleChange}
                                    lable={t("Siblings Age6")}
                                    respclass="col-sm-6  col-md-2 col-12"
                                    placeholder=""
                                />
                                <ReactSelect
                                    name="s6_M6"
                                    value={
                                        values.s_M6 === 1
                                            ? "1"
                                            : values.s_F6 === 1
                                                ? "0"
                                                : null
                                    }
                                    dynamicOptions={[
                                        { label: "M", value: "1" },
                                        { label: "F", value: "0" }
                                    ]}
                                    placeholderName={t("Select Gender")}
                                    handleChange={handleReactSelect}

                                    removeIsClearable
                                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                />
                                <Input
                                    type="text"
                                    className="form-control"
                                    id="s_SHP6"
                                    name="s_SHP6"
                                    value={values?.s_SHP6}
                                    onChange={handleChange}
                                    lable={t("Significant Health Problems 6")}
                                    respclass="col-sm-6  col-md-2 col-12"
                                    placeholder=""
                                />
                            </div>
                        </div>
                    </div>

                    <div className="col-12 col-sm-12 col-md-12">
                        <div
                            className="pt-3 pb-2 pr-2 pl-2 form-group"
                            style={{
                                border: "1px solid #ced4da",
                                borderRadius: "4px",
                                position: "relative",
                            }}
                        >
                            <label className="label" style={{ position: "absolute" }}>
                                {t("Children")}
                            </label>
                            <div className="row">



                                <Input
                                    type="text"
                                    className="form-control"
                                    id="c_M1Age_T"
                                    name="c_M1Age_T"
                                    value={values?.c_M1Age_T}
                                    onChange={handleChange}
                                    lable={t("Children Age1")}
                                    respclass="col-sm-6  col-md-2 col-12"
                                    placeholder=""
                                />
                                <ReactSelect
                                    name="c_M1"
                                    value={
                                        values.c_M1 === 1
                                            ? "1"
                                            : values.c_F1 === 1
                                                ? "0"
                                                : null
                                    }
                                    dynamicOptions={[
                                        { label: "M", value: "1" },
                                        { label: "F", value: "0" }
                                    ]}
                                    placeholderName={t("Select Gender")}
                                    handleChange={handleReactSelect}

                                    removeIsClearable
                                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                />
                                <Input
                                    type="text"
                                    className="form-control"
                                    id="c_SHP1"
                                    name="c_SHP1"
                                    value={values?.c_SHP1}
                                    onChange={handleChange}
                                    lable={t("Significant Health Problems 1")}
                                    respclass="col-sm-6  col-md-2 col-12"
                                    placeholder=""
                                />
                                <Input
                                    type="text"
                                    className="form-control"
                                    id="c_M2Age_T"
                                    name="c_M2Age_T"
                                    value={values?.s_M2Age_T}
                                    onChange={handleChange}
                                    lable={t("Siblings Age2")}
                                    respclass="col-sm-6  col-md-2 col-12"
                                    placeholder=""
                                />
                                <ReactSelect
                                    name="c_M2"
                                    value={
                                        values.c_M2 === 1
                                            ? "1"
                                            : values.c_F2 === 1
                                                ? "0"
                                                : null
                                    }
                                    dynamicOptions={[
                                        { label: "M", value: "1" },
                                        { label: "F", value: "0" }
                                    ]}
                                    placeholderName={t("Select Gender")}
                                    handleChange={handleReactSelect}

                                    removeIsClearable
                                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                />
                                <Input
                                    type="text"
                                    className="form-control"
                                    id="c_SHP2"
                                    name="c_SHP2"
                                    value={values?.c_SHP2}
                                    onChange={handleChange}
                                    lable={t("Significant Health Problems 2")}
                                    respclass="col-sm-6  col-md-2 col-12"
                                    placeholder=""
                                />
                                <Input
                                    type="text"
                                    className="form-control"
                                    id="c_M3Age_T"
                                    name="c_M3Age_T"
                                    value={values?.c_M3Age_T}
                                    onChange={handleChange}
                                    lable={t("Siblings Age3")}
                                    respclass="col-sm-6  col-md-2 col-12"
                                    placeholder=""
                                />
                                <ReactSelect
                                    name="c_M3"
                                    value={
                                        values.c_M3 === 1
                                            ? "1"
                                            : values.c_F3 === 1
                                                ? "0"
                                                : null
                                    }
                                    dynamicOptions={[
                                        { label: "M", value: "1" },
                                        { label: "F", value: "0" }
                                    ]}
                                    placeholderName={t("Select Gender")}
                                    handleChange={handleReactSelect}

                                    removeIsClearable
                                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                />
                                <Input
                                    type="text"
                                    className="form-control"
                                    id="c_SHP3"
                                    name="c_SHP3"
                                    value={values?.c_SHP3}
                                    onChange={handleChange}
                                    lable={t("Significant Health Problems 3")}
                                    respclass="col-sm-6  col-md-2 col-12"
                                    placeholder=""
                                />
                                <Input
                                    type="text"
                                    className="form-control"
                                    id="c_M4Age_T"
                                    name="c_M4Age_T"
                                    value={values?.c_M4Age_T}
                                    onChange={handleChange}
                                    lable={t("Siblings Age4")}
                                    respclass="col-sm-6  col-md-2 col-12"
                                    placeholder=""
                                />
                                <ReactSelect
                                    name="s4_M4"
                                    value={
                                        values.c_M4 === 1
                                            ? "1"
                                            : values.c_F4 === 1
                                                ? "0"
                                                : null
                                    }
                                    dynamicOptions={[
                                        { label: "M", value: "1" },
                                        { label: "F", value: "0" }
                                    ]}
                                    placeholderName={t("Select Gender")}
                                    handleChange={handleReactSelect}

                                    removeIsClearable
                                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                />
                                <Input
                                    type="text"
                                    className="form-control"
                                    id="c_SHP4"
                                    name="c_SHP4"
                                    value={values?.c_SHP4}
                                    onChange={handleChange}
                                    lable={t("Significant Health Problems 4")}
                                    respclass="col-sm-6  col-md-2 col-12"
                                    placeholder=""
                                />
                            </div>
                        </div>
                    </div>
                    <Input
                        type="text"
                        className="form-control"
                        id="gmM_Age"
                        name="gmM_Age"
                        value={values?.gmM_Age}
                        onChange={handleChange}
                        lable={t("GrandMother(Maternal) Age")}
                        respclass="col-sm-6  col-md-2 col-12"
                        placeholder=""
                    />

                    <Input
                        type="text"
                        className="form-control"
                        id="gmM_SHP"
                        name="gmM_SHP"
                        value={values?.gmM_SHP}
                        onChange={handleChange}
                        lable={t("Significant Health Problems")}
                        respclass="col-sm-6  col-md-2 col-12"
                        placeholder=""
                    />

                    <Input
                        type="text"
                        className="form-control"
                        id="gfM_AGE"
                        name="gfM_AGE"
                        value={values?.gfM_AGE}
                        onChange={handleChange}
                        lable={t("GrandFather(Maternal) Age")}
                        respclass="col-sm-6  col-md-2 col-12"
                        placeholder=""
                    />
                    <Input
                        type="text"
                        className="form-control"
                        id="gfM_SHP"
                        name="gfM_SHP"
                        value={values?.gfM_SHP}
                        onChange={handleChange}
                        lable={t("Significant Health Problems")}
                        respclass="col-sm-6  col-md-2 col-12"
                        placeholder=""
                    />
                    <Input
                        type="text"
                        className="form-control"
                        id="gmP_Age"
                        name="gmP_Age"
                        value={values?.gmP_Age}
                        onChange={handleChange}
                        lable={t("GrandMother(Paternal) Age")}
                        respclass="col-sm-6  col-md-2 col-12"
                        placeholder=""
                    />
                    <Input
                        type="text"
                        className="form-control"
                        id="gmP_SHP"
                        name="gmP_SHP"
                        value={values?.gmP_SHP}
                        onChange={handleChange}
                        lable={t("Significant Health Problems")}
                        respclass="col-sm-6  col-md-2 col-12"
                        placeholder=""
                    />
                    <Input
                        type="text"
                        className="form-control"
                        id="gfP_Age"
                        name="gfP_Age"
                        value={values?.gfP_Age}
                        onChange={handleChange}
                        lable={t("GrandFather(Paternal)")}
                        respclass="col-sm-6  col-md-2 col-12"
                        placeholder=""
                    />
                    <Input
                        type="text"
                        className="form-control"
                        id="gfP_SHP"
                        name="gfP_SHP"
                        value={values?.gfP_SHP}
                        onChange={handleChange}
                        lable={t("Significant Health Problems")}
                        respclass="col-sm-6  col-md-2 col-12"
                        placeholder=""
                    />

                </div>
                <Heading title={t("Mental HEALTH")} />
                <div className='row p-2'>
                    <Input
                        type="text"
                        name="ismpfY_T"
                        className="form-control"
                        placeholder={""}
                        value={values.ismpfY_T || ""}
                        onChange={handleText}
                        lable={t("Is stress a major problem for you?")}
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                    />

                    <ReactSelect
                        name="ismpfY"
                        value={
                            values.ismpfY_Yes === 1
                                ? "1"
                                : values.ismpfY_No === 1
                                    ? "0"
                                    : null
                        }
                        dynamicOptions={[{ label: t("Yes"), value: "1" }, { label: t("No"), value: "0" }]}
                        placeholderName={t("Is stress a major problem for you?")}
                        handleChange={handleReactSelect}
                        searchable={false}
                        removeIsClearable
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                    />

                    <Input
                        type="text"
                        id="dyfD_T"
                        name="dyfD_T"
                        placeholder=""
                        className="form-control"
                        value={values.dyfD_T || ""}
                        onChange={handleText}
                        lable={t("Do you feel depressed?")}
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                    />

                    <ReactSelect
                        name="dyfD"
                        value={
                            values.dyfD_Yes === 1
                                ? "1"
                                : values.dyfD_No === 1
                                    ? "0"
                                    : null
                        }
                        dynamicOptions={[{ label: t("Yes"), value: "1" }, { label: t("No"), value: "0" }]}
                        placeholderName={t("Do you feel depressed?")}
                        handleChange={handleReactSelect}
                        searchable={false}
                        removeIsClearable
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                    />

                    <Input
                        type="text"
                        id="dypwS_T"
                        name="dypwS_T"
                        className="form-control"
                        value={values.dypwS_T || ""}
                        placeholder=""
                        onChange={handleText}
                        lable={t("Do you panic when stressed?")}
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                    />

                    <ReactSelect
                        name="dypwS"
                        value={
                            values.dypwS_Yes === 1
                                ? "1"
                                : values.dypwS_No === 1
                                    ? "0"
                                    : null
                        }
                        dynamicOptions={[{ label: t("Yes"), value: "1" }, { label: t("No"), value: "0" }]}
                        placeholderName={t("Do you panic when stressed?")}
                        handleChange={handleReactSelect}
                        searchable={false}
                        removeIsClearable
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                    />
                    <Input
                        id="dypweoyA_T"
                        name="dypweoyA_T"
                        placeholder=""
                        className="form-control"
                        value={values.dypweoyA_T || ""}
                        onChange={handleChange}
                        lable={t("Do you have problems with eating or your appetite?")}
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                    />

                    <ReactSelect
                        name="dypweoyA"
                        value={
                            values.dypweoyA_Yes === 1
                                ? "1"
                                : values.dypweoyA_No === 1
                                    ? "0"
                                    : null
                        }
                        id="dypweoyA"
                        dynamicOptions={[{ label: t("Yes"), value: "1" }, { label: t("No"), value: "0" }]}
                        placeholderName={t("Do you have problems with eating or your appetite?")}
                        handleChange={handleReactSelect}
                        searchable={false}
                        removeIsClearable
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                    />

                    <Input
                        id="dycF_T"
                        placeholder=""
                        className="form-control"
                        name="dycF_T"
                        value={values.dycF_T || ""}
                        onChange={handleText}
                        lable={t("Do you cry frequently?")}
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                    />

                    <ReactSelect
                        name="dycF"
                        value={
                            values.dycF_Yes === 1
                                ? "1"
                                : values.dycF_No === 1
                                    ? "0"
                                    : null
                        }
                        dynamicOptions={[{ label: t("Yes"), value: "1" }, { label: t("No"), value: "0" }]}
                        placeholderName={t("Do you cry frequently?")}
                        handleChange={handleReactSelect}
                        searchable={false}
                        removeIsClearable
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                    />
                    <Input
                        name="hyeaS_T"
                        id="hyeaS_T"
                        placeholder=""
                        className="form-control"
                        value={values.hyeaS_T || ""}
                        onChange={handleText}
                        lable={t("Have you ever attempted suicide?")}
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                    />

                    <ReactSelect
                        name="hyeaS"
                        id="hyeaS"
                        value={
                            values.hyeaS_Yes === 1
                                ? "1"
                                : values.hyeaS_No === 1
                                    ? "0"
                                    : null
                        }
                        dynamicOptions={[{ label: t("Yes"), value: "1" }, { label: t("No"), value: "0" }]}
                        placeholderName={t("Have you ever attempted suicide?")}
                        handleChange={handleReactSelect}
                        searchable={false}
                        removeIsClearable
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                    />

                    <Input
                        name="hyestahY_T"
                        id="hyestahY_T"
                        placeholder=""
                        className="form-control"
                        value={values.hyestahY_T || ""}
                        onChange={handleText}
                        lable={t("Have you ever seriously thought about hurting yourself?")}
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                    />

                    <ReactSelect
                        name="hyestahY"
                        value={
                            values.hyestahY_Yes === 1
                                ? "1" : values.hyestahY_No === 1
                                    ? "0"
                                    : null
                        }
                        dynamicOptions={[{ label: t("Yes"), value: "1" }, { label: t("No"), value: "0" }]}
                        placeholderName={t("Have you ever seriously thought about hurting yourself?")}
                        handleChange={handleReactSelect}
                        searchable={false}
                        removeIsClearable
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                    />
                    <Input
                        id="dyhtS_T"
                        name="dyhtS_T"
                        placeholder=""
                        className="form-control"
                        value={values.dyhtS_T || ""}
                        onChange={handleText}
                        lable={t("Do you have trouble sleeping?")}
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                    />

                    <ReactSelect
                        name="dyhtS"
                        value={
                            values.dyhtS_Yes === 1
                                ?  "1" 
                                : values.dyhtS_No === 1
                                    ?  "0"
                                    : null
                        }
                        dynamicOptions={[{ label: t("Yes"), value: "1" }, { label: t("No"), value: "0" }]}
                        placeholderName={t("Do you have trouble sleeping?")}
                        handleChange={handleReactSelect}
                        searchable={false}
                        removeIsClearable
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                    />

                    <Input
                        id="hyebtoC_T"
                        name="hyebtoC_T"
                        placeholder=""
                        className={"form-control"}
                        value={values.hyebtoC_T || ""}
                        onChange={handleText}
                        lable={t("Have you ever been to a counselor?")}
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                    />

                    <ReactSelect
                        name="hyebtoC"
                        value={
                            values.hyebtoC_Yes === 1
                                ? "1"
                                : values.hyebtoC_No === 1
                                    ? "0"
                                    : null
                        }
                        dynamicOptions={[{ label: t("Yes"), value: "1" }, { label: t("No"), value: "0" }]}
                        placeholderName={t("Have you ever been to a counselor?")}
                        handleChange={handleReactSelect}
                        searchable={false}
                        removeIsClearable
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                    />


                </div>
                <Heading title={t("ANTHROPOMETRY(1st Visit)")} />
                <div className='row p-2'>
                    <Input
                        type="text"
                        className="form-control"
                        name="weight"
                        id="weight"
                        value={values.weight || values.Weight || ""}
                        onChange={handleChange}
                        lable={t("Weight(Kgs)")}
                        placeholder=""
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                    />
                    <Input
                        type="text"
                        className="form-control"
                        name="bloodPressure"
                        id="bloodPressure"
                        value={values.bloodPressure || ""}
                        onChange={handleChange}
                        lable={t("Blood Pressure")}
                        placeholder=""
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                    />
                    <Input
                        type="text"
                        className="form-control"
                        name="height"
                        id="height"
                        value={values.height || ""}
                        onChange={handleChange}
                        lable={t("Height(cm)")}
                        placeholder=""
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                    />
                    <Input
                        type="text"
                        className="form-control"
                        name="pulseRate"
                        id="pulseRate"
                        value={values.pulseRate || ""}
                        onChange={handleChange}
                        lable={t("Pulse Rate")}
                        placeholder=""
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                    />
                    <Input
                        type="text"
                        className="form-control"
                        name="bodyMassIndex"
                        id="bodyMassIndex"
                        value={values.bodyMassIndex || ""}
                        onChange={handleChange}
                        lable={t("Body Mass Index(BMI)")}
                        placeholder=""
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                    />
                    <Input
                        type="text"
                        className="form-control"
                        name="oxygenSaturation"
                        id="oxygenSaturation"
                        value={values.oxygenSaturation || ""}
                        onChange={handleChange}
                        lable={t("Oxygen Saturation")}
                        placeholder=""
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                    />
                    <Input
                        type="text"
                        className="form-control"
                        name="waistCircumference"
                        id="waistCircumference"
                        value={values.waistCircumference || ""}
                        onChange={handleChange}
                        lable={t("Waist Circumference")}
                        placeholder=""
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                    />
                    <Input
                        type="text"
                        className="form-control"
                        name="fatPercentage"
                        id="fatPercentage"
                        value={values.fatPercentage || ""}
                        onChange={handleChange}
                        lable={t("fat Percentage")}
                        placeholder=""
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                    />
                    <Input
                        type="text"
                        className="form-control"
                        name="fatMass"
                        id="fatMass"
                        value={values.fatMass || ""}
                        onChange={handleChange}
                        lable={t("fat Mass")}
                        placeholder=""
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                    />



                    <ReactSelect
                        placeholderName={t("Skin")}
                        name="skin"
                        value={values?.skin ? values?.skin : "0"}
                        handleChange={handleReactSelect}
                        dynamicOptions={TRUE_FALSE_OPTIONS}
                        searchable={false}
                        id="skin"
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                        removeIsClearable={true}
                    />
                    <Input
                        type="text"
                        className="form-control"
                        id="skin_T"
                        name="skin_T"
                        value={values?.skin_T || ""}
                        onChange={handleChange}
                        lable={t("skin Text")}
                        placeholder=" "
                        respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                    />

                    <ReactSelect
                        placeholderName={t("head Neck")}
                        name="headNeck"
                        value={values?.headNeck ? values?.headNeck : "0"}
                        handleChange={handleReactSelect}
                        dynamicOptions={TRUE_FALSE_OPTIONS}
                        searchable={false}
                        id="headNeck"
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                        removeIsClearable={true}
                    />
                    <Input
                        type="text"
                        className="form-control"
                        id="head_Neck_T"
                        name="head_Neck_T"
                        value={values?.head_Neck_T || ""}
                        onChange={handleChange}
                        lable={t("head Neck")}
                        placeholder=" "
                        respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                    />
                    <ReactSelect
                        placeholderName={t("ears")}
                        name="ears"
                        value={values?.ears ? values?.ears : "0"}
                        handleChange={handleReactSelect}
                        dynamicOptions={TRUE_FALSE_OPTIONS}
                        searchable={false}
                        id="ears"
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                        removeIsClearable={true}
                    />
                    <Input
                        type="text"
                        className="form-control"
                        id="ears_T"
                        name="ears_T"
                        value={values?.ears_T || ""}
                        onChange={handleChange}
                        lable={t("ears ")}
                        placeholder=" "
                        respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                    />
                    <ReactSelect
                        placeholderName={t("nose")}
                        name="nose"
                        value={values?.nose ? values?.nose : "0"}
                        handleChange={handleReactSelect}
                        dynamicOptions={TRUE_FALSE_OPTIONS}
                        searchable={false}
                        id="nose"
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                        removeIsClearable={true}
                    />
                    <Input
                        type="text"
                        className="form-control"
                        id="nose_T"
                        name="nose_T"
                        value={values?.nose_T || ""}
                        onChange={handleChange}
                        lable={t("nose ")}
                        placeholder=" "
                        respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                    />
                    <ReactSelect
                        placeholderName={t("throat")}
                        name="throat"
                        value={String(values?.throat ? values?.throat : 0)}
                        handleChange={handleReactSelect}
                        dynamicOptions={TRUE_FALSE_OPTIONS}
                        searchable={false}
                        id="throat"
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                        removeIsClearable={true}
                    />
                    <Input
                        type="text"
                        className="form-control"
                        id="throat_T"
                        name="throat_T"
                        value={values?.throat_T || ""}
                        onChange={handleChange}
                        lable={t("throat ")}
                        placeholder=" "
                        respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                    />
                    <ReactSelect
                        placeholderName={t("lungs")}
                        name="lungs"
                        value={values?.lungs ? values?.lungs : "0"}
                        handleChange={handleReactSelect}
                        dynamicOptions={TRUE_FALSE_OPTIONS}
                        searchable={false}
                        id="lungs"
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                        removeIsClearable={true}
                    />
                    <Input
                        type="text"
                        className="form-control"
                        id="lungs_T"
                        name="lungs_T"
                        value={values?.lungs_T || ""}
                        onChange={handleChange}
                        lable={t("lungs")}
                        placeholder=" "
                        respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                    />

                    <ReactSelect
                        placeholderName={t("chestHeart")}
                        name="chestHeart"
                        value={values?.chestHeart ? values?.chestHeart : "0"}
                        handleChange={handleReactSelect}
                        dynamicOptions={TRUE_FALSE_OPTIONS}
                        searchable={false}
                        id="chestHeart"
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                        removeIsClearable={true}
                    />
                    <Input
                        type="text"
                        className="form-control"
                        id="chest_Heart_T"
                        name="chest_Heart_T"
                        value={values?.chest_Heart_T || ""}
                        onChange={handleChange}
                        lable={t("chest Heart")}
                        placeholder=" "
                        respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                    />
                    <ReactSelect
                        placeholderName={t("back")}
                        name="back"
                        value={String(values?.back ? values?.back : "0")}
                        handleChange={handleReactSelect}
                        dynamicOptions={TRUE_FALSE_OPTIONS}
                        searchable={false}
                        id="back"
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                        removeIsClearable={true}
                    />
                    <Input
                        type="text"
                        className="form-control"
                        id="back_T"
                        name="back_T"
                        value={values?.back_T || ""}
                        onChange={handleChange}
                        lable={t("back")}
                        placeholder=" "
                        respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                    />
                    <ReactSelect
                        placeholderName={t("bladder")}
                        name="bladder1"
                        value={String(values?.bladder1 ? values?.bladder1:"0")}
                        handleChange={handleReactSelect}
                        dynamicOptions={TRUE_FALSE_OPTIONS}
                        searchable={false}
                        id="bladder1"
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                        removeIsClearable={true}
                    />
                    <Input
                        type="text"
                        className="form-control"
                        id="bladder_T"
                        name="bladder_T"
                        value={values?.bladder_T || ""}
                        onChange={handleChange}
                        lable={t("bladder")}
                        placeholder=" "
                        respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                    />
                    <ReactSelect
                        placeholderName={t("bowel")}
                        name="bowel1"
                        value={String(values?.bowel1 ?? "0")}
                        handleChange={handleReactSelect}
                        dynamicOptions={TRUE_FALSE_OPTIONS}
                        searchable={false}
                        id="bowel1"
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                        removeIsClearable={true}
                    />
                    <Input
                        type="text"
                        className="form-control"
                        id="bowel_T"
                        name="bowel_T"
                        value={values?.bowel_T || ""}
                        onChange={handleChange}
                        lable={t("bowel")}
                        placeholder=" "
                        respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                    />

                    <ReactSelect
                        placeholderName={t("circulation")}
                        name="circulation1"
                        value={String(values?.circulation1 ?? 0)}
                        handleChange={handleReactSelect}
                        dynamicOptions={TRUE_FALSE_OPTIONS}
                        searchable={false}
                        id="circulation1"
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                        removeIsClearable={true}
                    />
                    <Input
                        type="text"
                        className="form-control"
                        id="circulation_T"
                        name="circulation_T"
                        value={values?.circulation_T || ""}
                        onChange={handleChange}
                        lable={t("circulation")}
                        placeholder=" "
                        respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                    />

                    <ReactSelect
                        placeholderName={t("recentChanges")}
                        name="recentChanges"
                        value={String(values?.recentChanges ?? 0)}
                        handleChange={handleReactSelect}
                        dynamicOptions={TRUE_FALSE_OPTIONS}
                        searchable={false}
                        id="recentChanges"
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                        removeIsClearable={true}
                    />
                    <Input
                        type="text"
                        className="form-control"
                        id="recentChanges_T"
                        name="recentChanges_T"
                        value={values?.recentChanges_T || ""}
                        onChange={handleChange}
                        lable={t("recentChanges")}
                        placeholder=" "
                        respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                    />
                    <ReactSelect
                        placeholderName={t("weightChange")}
                        name="weightChange"
                        value={String(values?.weightChange ?? 0)}
                        handleChange={handleReactSelect}
                        dynamicOptions={TRUE_FALSE_OPTIONS}
                        searchable={false}
                        id="weightChange"
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                        removeIsClearable={true}
                    />
                    <Input
                        type="text"
                        className="form-control"
                        id="weight1_T"
                        name="weight1_T"
                        value={values?.weight1_T || ""}
                        onChange={handleChange}
                        lable={t("weightChange")}
                        placeholder=" "
                        respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                    />
                    <ReactSelect
                        placeholderName={t("energyLevel")}
                        name="energyLevel"
                        value={String(values?.energyLevel ?? 0)}
                        handleChange={handleReactSelect}
                        dynamicOptions={TRUE_FALSE_OPTIONS}
                        searchable={false}
                        id="energyLevel"
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                        removeIsClearable={true}
                    />
                    <Input
                        type="text"
                        className="form-control"
                        id="energylevel_T"
                        name="energylevel_T"
                        value={values?.energylevel_T || ""}
                        onChange={handleChange}
                        lable={t("energyLevel")}
                        placeholder=" "
                        respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                    />
                    <ReactSelect
                        placeholderName={t("abilityToSleep")}
                        name="abilityToSleep"
                        value={String(values?.abilityToSleep ?? 0)}
                        handleChange={handleReactSelect}
                        dynamicOptions={TRUE_FALSE_OPTIONS}
                        searchable={false}
                        id="abilityToSleep"
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                        removeIsClearable={true}
                    />
                    <Input
                        type="text"
                        className="form-control"
                        id="abilitytosleep_T"
                        name="abilitytosleep_T"
                        value={values?.abilitytosleep_T || ""}
                        onChange={handleChange}
                        lable={t("abilityToSleep")}
                        placeholder=" "
                        respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                    />
                    <ReactSelect
                        placeholderName={t("otherPainDiscomfort")}
                        name="otherPainDiscomfort"
                        value={String(values?.otherPainDiscomfort ?? 0)}
                        handleChange={handleReactSelect}
                        dynamicOptions={TRUE_FALSE_OPTIONS}
                        searchable={false}
                        id="otherPainDiscomfort"
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                        removeIsClearable={true}
                    />
                    <Input
                        type="text"
                        className="form-control"
                        id="otherPainDiscomfort_T"
                        name="otherPainDiscomfort_T"
                        value={values?.otherPainDiscomfort_T || ""}
                        onChange={handleChange}
                        lable={t("otherPainDiscomfort")}
                        placeholder=" "
                        respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                    />
                    <ReactSelect
                        placeholderName={t("intestinal")}
                        name="intestinal"
                        value={String(values?.intestinal ?? 0)}
                        handleChange={handleReactSelect}
                        dynamicOptions={TRUE_FALSE_OPTIONS}
                        searchable={false}
                        id="intestinal"
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                        removeIsClearable={true}
                    />
                    <Input
                        type="text"
                        className="form-control"
                        id="intestinal_T"
                        name="intestinal_T"
                        value={values?.intestinal_T || ""}
                        onChange={handleChange}
                        lable={t("intestinal")}
                        placeholder=" "
                        respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                    />

                </div>
                <div className='m-2'>
                    <button
                        className="btn btn-primary ml-2"
                        type='button'
                        style={{ float: "right" }}
                        onClick={handleSave}
                    >
                        {values?.id ? t("Update") : t("Save")}
                    </button>
                </div>
            </div>
            {tableData?.length > 0 ?
                <>
                    <Heading title={t("List")} />
                    <Tables
                        thead={THEAD}
                        tbody={tableData?.map((item, index) => ({
                            SNo: index + 1,
                            PID: item?.patientID,
                            Tid: item?.transactionID,
                            Creted: item?.createdBy,
                            Edit: <i className="fa fa-edit" aria-hidden="true" onClick={() => { handleEdit(item) }}></i>,
                            // Print: <i className="fa fa-print" aria-hidden="true" onClick={() => { handlePrint(item) }}></i>,
                        }))}
                    />
                </>
                : ""}

        </div>
    )
}

export default NutritionAssessment;