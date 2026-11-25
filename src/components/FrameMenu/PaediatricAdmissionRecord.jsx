import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next';
import Heading from '../UI/Heading';
import ReactSelect from '../formComponent/ReactSelect';
import TextAreaInput from '../formComponent/TextAreaInput';
import Input from '../formComponent/Input';
import Tables from '../UI/customTable';
import abdomanChestImage from "../../../public/img/preodicrecord.png"
import MultiSelectComp from '../formComponent/MultiSelectComp';
import DatePicker from '../formComponent/DatePicker';
import TimePicker from '../formComponent/TimePicker';
import { useLocalStorage } from '../../utils/hooks/useLocalStorage';
import { EditPaediatricAdmissionRecord, GetdataPaediatricAdmissionRecord, SavePaediatricAdmissionRecord, UpdatePaediatricAdmissionRecord } from '../../networkServices/nursingWardAPI';
import { notify } from '../../utils/utils';
import moment from 'moment';

function PaediatricAdmissionRecord({ data }) {
    const [t] = useTranslation()
    const { VITE_DATE_FORMAT } = import.meta.env;
    const localData = useLocalStorage("userData", "get")
    const initialValues = {
        id: 0,
        patientID: data?.patientID,
        name: data?.pName,
        contactTel: data?.mobile,
        admissionDate: data?.admitDate,
        transactionId: data?.transactionID,
        ipNo: data?.ipdno,
        readY: "",
        readN: "",
        dischargemonthY: "",
        dischargemonthN: "",
        presentingComplaints: "",
        weight: "",
        heightLength: "",
        headCirc: "",
        lengthIllnessDays: "",
        feverDays: "",
        feverY: "",
        feverN: "",
        coughDays: "",
        coughY: "",
        coughN: "",
        coughGT2WeeksY: "",
        coughGT2WeeksN: "",
        coughLast2BChronicY: "",
        coughLast2BChronicN: "",
        difficultyBreathingY: "",
        difficultyBreathingN: "",
        diarrhoeaDays: "",
        diarrhoeaY: "",
        diarrhoeaN: "",
        diarrhoeabloodyDays: "",
        diarrhoeabloodyY: "",
        diarrhoeabloodyN: "",
        diarrhoeaGT14dY: "",
        diarrhoeaGT14dN: "",
        bloodInStoolY: "",
        bloodInStoolN: "",
        vomitingNo24hrs: "",
        vomitingY: "",
        vomitingN: "",
        vomitingNot24hrsY: "",
        vomitingNot24hrsN: "",
        difficultFeedingY: "",
        difficultFeedingN: "",
        convulsionsLast24hrsY: "",
        convulsionsLast24hrsN: "",
        numberLast24hrs: "",
        partialFocalFitsY: "",
        partialFocalFitsN: "",
        vaccineCardavailableY: "",
        vaccineCardavailableN: "",
        noBCG: "",
        noOPV: "",
        noIPV: "",
        noPentavalent: "",
        noPneumo: "",
        noRota: "",
        noMeasles: "",
        noMR: "",
        vitaminAY: "",
        vitaminAN: "",
        pmtctPos: "",
        pmtctNeg: "",
        pmtctUnk: "",
        growthDevelopment: "",
        familySocialHistory: "",
        nutritionalHistory: "",
        additionalHistory: "",
        treatmentHistory: "",
        respiratoryENT: "",
        cardiovascular: "",
        gastrointestinalGU: "",
        cns: "",
        cvs: "",
        coughChronicNo: "",
        coughGT2WeeksNo: "",
        temp: "",
        respRate: "",
        hr: "",
        sat: "",
        bp: "",
        summary: "",
        whZscore: "",
        muaCcm: "",
        partialFocalFits: "",
        difficultFeedingNo: "",
        vomitingNot24hrsNo: "",
        bloodInStoolNo: "",
        diarrhoeaGT14dNo: "",
        difficultyBreathingNo: "",
        oralThrushY: "",
        oralThrushN: "",
        lymphY: "",
        lymphN: "",
        fingerClubbingY: "",
        fingerClubbingN: "",
        eyeSignsPus: "",
        eyeSignsulceration: "",
        eyeSignsNone: "",
        jaundiceY: "",
        jaundiceN: "",
        oedemaNone: "",
        oedemaFoot: "",
        oedemaKnee: "",
        oedemaFace: "",
        rEar: "",
        lEar: "",
        nose: "",
        throat: "",
        powerUR: "",
        powerLR: "",
        powerUL: "",
        powerLL: "",
        toneUR: "",
        toneLR: "",
        toneUL: "",
        toneLL: "",
        reflexesUR: "",
        reflexesLR: "",
        reflexesUL: "",
        reflexesLL: "",
        plantarUR: "",
        plantarLR: "",
        plantarUL: "",
        plantarLL: "",
        sensationUR: "",
        sensationLR: "",
        sensationUL: "",
        sensationLL: "",
        clinicianName: "",
        otherinvestigation: "",
        malaria1: "",
        malaria2: "",
        malariaSeverity: "",
        pneumonia1: "",
        pneumonia2: "",
        pneumoniaSeverity: "",
        diarrhoea1: "",
        diarrhoea2: "",
        diarrhoeaType: "",
        dehydration1: "",
        dehydration2: "",
        dehydrationLevel: "",
        hivResult1: "",
        hivResult2: "",
        hivResultType: "",
        malnutrition1: "",
        malnutrition2: "",
        malnutritionType: "",
        suspectedTB1: "",
        suspectedTB2: "",
        suspectedTBSeverity: "",
        prematurity1: "",
        prematurity2: "",
        neonatalSepsis1: "",
        neonatalSepsis2: "",
        other1: "",
        other2: "",
        otherSeverity: "",
        anaemia1: "",
        anaemia2: "",
        anaemiaSeverity: "",
        sickleCell1: "",
        sickleCell2: "",
        sickleCellSeverity: "",
        asthma1: "",
        asthma2: "",
        asthmaSeverity: "",
        meningitis1: "",
        meningitis2: "",
        rickets1: "",
        rickets2: "",
        stridorY: "",
        stridorN: "",
        centralCyanosisY: "",
        centralCyanosisN: "",
        intercostalY: "",
        intercostalN: "",
        gruntingY: "",
        gruntingN: "",
        acidoticY: "",
        acidoticN: "",
        wheezeY: "",
        wheezeN: "",
        cracklesY: "",
        cracklesN: "",
        pulseNormal: "",
        pulseWeak: "",
        capRefillSecs: "",
        capRefillX: "",
        warmHand: "",
        warmElbow: "",
        warmShoulder: "",
        pallor0: "",
        pallorPlus: "",
        pallorPlusPlus: "",
        sunkenEyesY: "",
        sunkenEyesN: "",
        skinPinch0: "",
        skinPinch1: "",
        skinPinchGE2: "",
        avpua: "",
        avpuv: "",
        avpup: "",
        avpuu: "",
        canDrinkY: "",
        canDrinkN: "",
        stiffNeckY: "",
        stiffNeckN: "",
        bulgingFontY: "",
        bulgingFontN: "",
        infantIrritableY: "",
        infantIrritableN: "",
        reducedMovementY: "",
        reducedMovementN: "",
        umbNormal: "",
        umbPus: "",
        umbPusRed: "",
        ricketsY: "",
        ricketsN: "",
        malariaBloodSlide: "",
        malariaRapidTest: "",
        haemHb: "",
        haemFullHaemogram: "",
        chemGlucose: "",
        chemStickTest: "",
        labNaK: "",
        labUE: "",
        labCaP: "",
        labAb: "",
        labLFT: "",
        microLP: "",
        microBloodCulture: "",
        hivRapid: "",
        hivpcr: "",
        xrayCXR: "",
        xrayWrist: "",
        xrayWristOther: "",
        urineUrinalysis: "",
        urineMicroCulture: "",
        tbMicroAFB: "",
        tbMantoux: "",
        stoolMicroscopy: "",
        stoolMicroCulture: "",
        date: new Date(),
        time: ""
    }

    const [values, setValues] = useState(initialValues)
    const [tabelData, setTableData] = useState([])

    const YES_NO = [
        { label: t("Yes"), value: "1" },
        { label: t("No"), value: "0" }
    ]

    const POSITIVE_NEG_UNKNOWN = [
        { label: t("Positive"), value: "1" },
        { label: t("Negative"), value: "2" },
        { label: t("Unknown"), value: "0" }
    ]

    const PUS_ULCER = [
        { label: t("Pus"), value: "1" },
        { label: t("Ulceration"), value: "0" },
    ]

    const NORMAL_WEAK = [
        { label: t("Normal"), value: "1" },
        { label: t("Weak"), value: "2" }
    ]

    // Multi select options
    const NONEFOOT_KNEE_FACE = [
        { name: "Knee", code: "oedemaKnee" },
        { name: "Foot", code: "oedemaFoot" },
        { name: "Face", code: "oedemaFace" },
        { name: "None", code: "oedemaNone" },
    ]

    const MALERIA = [
        { name: "Blood slide", code: "malariaBloodSlide" },
        { name: "Rapid Test", code: "malariaRapidTest" },
    ]

    const GLUCOSE = [
        { name: "Stick test", code: "chemStickTest" },
        { name: "Laboratory", code: "chemGlucose" },
    ]

    const HAEMATOLOGY = [
        { name: "Hb", code: "haemHb" },
        { name: "Full haemogram", code: "haemFullHaemogram" },
    ]

    const CHEMISTRY = [
        { name: "Na/K", code: "labNaK" },
        { name: "U&C", code: "labUE" },
        { name: "Ca+Phos", code: "labCaP" },
        { name: "Alb", code: "labAb" },
        { name: "LFT", code: "labLFT" },
    ]

    const MICROBIOLOGY = [
        { name: "Lumber Puncture", code: "microLP" },
        { name: "Blood culture", code: "microBloodCulture" },
    ]

    const XRAY = [
        { name: "CXR", code: "xrayCXR" },
        { name: "Wrist", code: "xrayWrist" },
    ]

    const HIV = [
        { name: "Rapid test", code: "hivRapid" },
        { name: "PCR", code: "hivpcr" },
    ]

    const TEST_TB = [
        { name: "Microscopy for AAFBs", code: "tbMicroAFB" },
        { name: "Mantoux", code: "tbMantoux" },
    ]

    const STOOL = [
        { name: "Microscopy", code: "stoolMicroscopy" },
        { name: "Micro & culture", code: "stoolMicroCulture" },
    ]

    const URINE = [
        { name: "Urinalysis", code: "urineUrinalysis" },
        { name: "Micro & culture", code: "urineMicroCulture" },
    ]

    const checklistOptions = {
        "Oedema": NONEFOOT_KNEE_FACE,
        "MALERIA": MALERIA,
        "GLUCOSE": GLUCOSE,
        "HAEMATOLOGY": HAEMATOLOGY,
        "CHEMISTRY": CHEMISTRY,
        "MICROBIOLOGY": MICROBIOLOGY,
        "XRAY": XRAY,
        "HIV": HIV,
        "TEST_TB": TEST_TB,
        "STOOL": STOOL,
        "URINE": URINE
    }

    // Helper functions for ReactSelect values - FIXED VERSION
    const getYesNoValue = (yValue, nValue) => {
        if (yValue === "1" || yValue === 1) return "1";
        if (nValue === "1" || nValue === 1) return "0";
        return "";
    };
    const GETCIRCWARMAT = (Hand, Elbow, Shoulder) => {
        debugger
        if (Hand === "1" || Hand === 1) return "11";
        if (Elbow === "1" || Elbow === 1) return "2";
        if (Shoulder === "1" || Shoulder === 1) return "3";
        return "";
    };

    const getPosNegUnkValue = (posValue, negValue, unkValue) => {
        if (posValue === "1") return "1";
        if (negValue === "1") return "2";
        if (unkValue === "1") return "0";
        return "";
    };

    // Optimized handlers
    const handleReactSelectChange = (name, val) => {
        setValues(prev => ({
            ...prev,
            [name]: val?.value || "",
        }));
    }

    const handleChange = (e) => {
        const { name, value } = e.target;
        setValues(prev => ({
            ...prev,
            [name]: value,
        }));
    }

    const handleRadioChange = (name, value) => {
        setValues(prev => {
            // If this is primary/secondary selection
            if (value === "1" || value === "2") {
                return {
                    ...prev,
                    [`${name}1`]: value === "1" ? "1" : "",
                    [`${name}2`]: value === "2" ? "2" : "",
                };
            }

            // For severity / type radios
            return {
                ...prev,
                [name]: value,
            };
        });
    };

    const handleYesNoRadio = (fieldPrefix, value) => {
        setValues(prev => ({
            ...prev,
            [`${fieldPrefix}Y`]: value === "1" ? "1" : "",
            [`${fieldPrefix}N`]: value === "0" ? "1" : "",
        }));
    }

    const handleMultiSelectChange = (section, selectedOptions) => {
        setValues(prev => {
            const updated = { ...prev };
            checklistOptions[section]?.forEach(opt => {
                updated[opt.code] = "0";
            });
            selectedOptions.forEach(sel => {
                updated[sel.code] = "1";
            });
            return updated;
        });
    };

    const handlDateTimeChange = (e) => {
        const { name, value } = e.target;
        setValues((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    /* const handleTimeChange = (name, time) => {
        setValues(prev => ({
            ...prev,
            [name]: time,
        }));
    } */

    const getdataPaediatricAdmissionRecord = async () => {
        try {
            const response = await GetdataPaediatricAdmissionRecord(data?.transactionID)
            if (response.success) {
                setTableData(response?.data)
            }
        } catch (error) {
            notify(error?.message, "error")
        }
    }

    const mapEditValues = (data) => {
        // Helper function to safely get values
        const getValue = (field, defaultValue = "") => {
            const value = data?.[field];
            return value !== undefined && value !== null ? value.toString() : defaultValue;
        };

        // Helper function for Yes/No fields
        const getYesNoValue = (yField, nField) => {
            const yValue = data?.[yField];
            const nValue = data?.[nField];
            if (yValue === "1" || yValue === 1) return { y: "1", n: "" };
            if (nValue === "1" || nValue === 1) return { y: "", n: "1" };
            return { y: "", n: "" };
        };

        // Helper for multi-select fields
        const getChecklistValue = (field) => {
            const value = data?.[field];
            return value === "1" || value === 1 ? "1" : "0";
        };

        return {
            id: getValue("Id", "0"),
            // Readmission
            readY: getValue("ReadY", ""),
            readN: getValue("ReadN", ""),

            // Discharge
            dischargemonthY: getValue("DischargemonthY", ""),
            dischargemonthN: getValue("DischargemonthN", ""),

            // Complaints
            presentingComplaints: getValue("PresentingComplaints", ""),

            // Measurements
            weight: getValue("Weight", ""),
            heightLength: getValue("HeightLength", ""),
            headCirc: getValue("HeadCirc", ""),
            lengthIllnessDays: getValue("LengthIllnessDays", ""),

            // Fever
            feverDays: getValue("FeverDays", ""),
            feverY: getValue("FeverY", ""),
            feverN: getValue("FeverN", ""),

            // Cough
            coughDays: getValue("CoughDays", ""),
            coughY: getValue("CoughY", ""),
            coughN: getValue("CoughN", ""),
            coughGT2WeeksY: getValue("CoughGT2WeeksY", ""),
            coughGT2WeeksN: getValue("CoughGT2WeeksN", ""),
            coughChronicNo: getValue("CoughChronicNo", ""),
            coughLast2BChronicY: getValue("CoughLast2BChronicY", ""),
            coughLast2BChronicN: getValue("CoughLast2BChronicN", ""),

            // Difficulty breathing
            difficultyBreathingY: getValue("DifficultyBreathingY", ""),
            difficultyBreathingN: getValue("DifficultyBreathingN", ""),
            difficultyBreathingNo: getValue("DifficultyBreathingNo", ""),

            // Diarrhoea
            diarrhoeaDays: getValue("DiarrhoeaDays", ""),
            diarrhoeaY: getValue("DiarrhoeaY", ""),
            diarrhoeaN: getValue("DiarrhoeaN", ""),
            diarrhoeabloodyDays: getValue("DiarrhoeabloodyDays", ""),
            diarrhoeabloodyY: getValue("DiarrhoeabloodyY", ""),
            diarrhoeabloodyN: getValue("DiarrhoeabloodyN", ""),
            diarrhoeaGT14dY: getValue("DiarrhoeaGT14dY", ""),
            diarrhoeaGT14dN: getValue("DiarrhoeaGT14dN", ""),
            diarrhoeaGT14dNo: getValue("DiarrhoeaGT14dNo", ""),
            bloodInStoolY: getValue("BloodInStoolY", ""),
            bloodInStoolN: getValue("BloodInStoolN", ""),
            bloodInStoolNo: getValue("BloodInStoolNo", ""),

            // Vomiting
            vomitingNo24hrs: getValue("VomitingNo24hrs", ""),
            vomitingY: getValue("VomitingY", ""),
            vomitingN: getValue("VomitingN", ""),
            vomitingNot24hrsY: getValue("VomitingNot24hrsY", ""),
            vomitingNot24hrsN: getValue("VomitingNot24hrsN", ""),
            vomitingNot24hrsNo: getValue("VomitingNot24hrsNo", ""),

            // Difficult feeding
            difficultFeedingY: getValue("DifficultFeedingY", ""),
            difficultFeedingN: getValue("DifficultFeedingN", ""),
            difficultFeedingNo: getValue("DifficultFeedingNo", ""),

            // Convulsions
            convulsionsLast24hrsY: getValue("ConvulsionsLast24hrsY", ""),
            convulsionsLast24hrsN: getValue("ConvulsionsLast24hrsN", ""),
            numberLast24hrs: getValue("NumberLast24hrs", ""),

            // Partial focal fits
            partialFocalFitsY: getValue("PartialFocalFitsY", ""),
            partialFocalFitsN: getValue("PartialFocalFitsN", ""),
            partialFocalFits: getValue("PartialFocalFits", ""),

            // Vaccine
            vaccineCardavailableY: getValue("VaccineCardavailableY", ""),
            vaccineCardavailableN: getValue("VaccineCardavailableN", ""),

            // Vaccine doses
            noBCG: getValue("NoBCG", ""),
            noOPV: getValue("NoOPV", ""),
            noIPV: getValue("NoIPV", ""),
            noPentavalent: getValue("NoPentavalent", ""),
            noPneumo: getValue("NoPneumo", ""),
            noRota: getValue("NoRota", ""),
            noMeasles: getValue("NoMeasles", ""),
            noMR: getValue("NoMR", ""),

            // Vitamin A
            vitaminAY: getValue("VitaminAY", ""),
            vitaminAN: getValue("VitaminAN", ""),

            // PMTCT
            pmtctPos: getValue("PMTCTPos", ""),
            pmtctNeg: getValue("PMTCTNeg", ""),
            pmtctUnk: getValue("PMTCTUnk", ""),

            // History fields
            growthDevelopment: getValue("GrowthDevelopment", ""),
            familySocialHistory: getValue("FamilySocialHistory", ""),
            nutritionalHistory: getValue("NutritionalHistory", ""),
            additionalHistory: getValue("AdditionalHistory", ""),
            treatmentHistory: getValue("TreatmentHistory", ""),
            respiratoryENT: getValue("RespiratoryENT", ""),
            cardiovascular: getValue("Cardiovascular", ""),
            gastrointestinalGU: getValue("GastrointestinalGU", ""),
            cns: getValue("CNS", ""),
            cvs: getValue("CVS", ""),

            // Summary
            summary: getValue("Summary", ""),
            whZscore: getValue("WHZscore", ""),
            muaCcm: getValue("MUACcm", ""),

            // Vital signs
            temp: getValue("Temp", ""),
            respRate: getValue("RespRate", ""),
            hr: getValue("HR", ""),
            sat: getValue("Sat", ""),
            bp: getValue("BP", ""),

            // General Examination
            oralThrushY: getValue("OralThrushY", ""),
            oralThrushN: getValue("OralThrushN", ""),
            lymphY: getValue("LymphY", ""),
            lymphN: getValue("LymphN", ""),
            fingerClubbingY: getValue("FingerClubbingY", ""),
            fingerClubbingN: getValue("FingerClubbingN", ""),
            eyeSignsPus: getValue("EyeSignsPus", ""),
            eyeSignsulceration: getValue("EyeSignsulceration", ""),
            eyeSignsNone: getValue("EyeSignsNone", ""),
            jaundiceY: getValue("JaundiceY", ""),
            jaundiceN: getValue("JaundiceN", ""),

            // Oedema
            oedemaNone: getChecklistValue("OedemaNone"),
            oedemaFoot: getChecklistValue("OedemaFoot"),
            oedemaKnee: getChecklistValue("OedemaKnee"),
            oedemaFace: getChecklistValue("OedemaFace"),

            // A - Airway
            stridorY: getValue("StridorY", ""),
            stridorN: getValue("StridorN", ""),

            // B - Breathing
            centralCyanosisY: getValue("CentralCyanosisY", ""),
            centralCyanosisN: getValue("CentralCyanosisN", ""),
            intercostalY: getValue("IntercostalY", ""),
            intercostalN: getValue("IntercostalN", ""),
            gruntingY: getValue("GruntingY", ""),
            gruntingN: getValue("GruntingN", ""),
            acidoticY: getValue("AcidoticY", ""),
            acidoticN: getValue("AcidoticN", ""),
            wheezeY: getValue("WheezeY", ""),
            wheezeN: getValue("WheezeN", ""),
            cracklesY: getValue("CracklesY", ""),
            cracklesN: getValue("CracklesN", ""),

            // Circ & Dehydration
            pulseNormal: getValue("PulseNormal", ""),
            pulseWeak: getValue("PulseWeak", ""),
            capRefillSecs: getValue("CapRefillSecs", ""),
            capRefillX: getValue("CapRefillX", ""),
            warmHand: getValue("WarmHand", ""),
            warmElbow: getValue("WarmElbow", ""),
            warmShoulder: getValue("WarmShoulder", ""),
            pallor0: getValue("Pallor0", ""),
            pallorPlus: getValue("PallorPlus", ""),
            pallorPlusPlus: getValue("PallorPlusPlus", ""),
            sunkenEyesY: getValue("SunkenEyesY", ""),
            sunkenEyesN: getValue("SunkenEyesN", ""),
            skinPinch0: getValue("SkinPinch0", ""),
            skinPinch1: getValue("SkinPinch1", ""),
            skinPinchGE2: getValue("SkinPinchGE2", ""),

            // D - Disability
            avpua: getValue("Avpua", ""),
            avpuv: getValue("Avpuv", ""),
            avpup: getValue("Avpup", ""),
            avpuu: getValue("Avpuu", ""),
            canDrinkY: getValue("CanDrinkY", ""),
            canDrinkN: getValue("CanDrinkN", ""),
            stiffNeckY: getValue("StiffNeckY", ""),
            stiffNeckN: getValue("StiffNeckN", ""),
            bulgingFontY: getValue("BulgingFontY", ""),
            bulgingFontN: getValue("BulgingFontN", ""),

            // Infant <1yr
            infantIrritableY: getValue("InfantIrritableY", ""),
            infantIrritableN: getValue("InfantIrritableN", ""),
            reducedMovementY: getValue("ReducedMovementY", ""),
            reducedMovementN: getValue("ReducedMovementN", ""),
            umbNormal: getValue("UmbNormal", ""),
            umbPus: getValue("UmbPus", ""),
            umbPusRed: getValue("UmbPusRed", ""),

            // ENT Exam
            rEar: getValue("REar", ""),
            lEar: getValue("LEar", ""),
            nose: getValue("Nose", ""),
            throat: getValue("Throat", ""),

            // Neurological Exam
            powerUR: getValue("PowerUR", ""),
            powerLR: getValue("PowerLR", ""),
            powerUL: getValue("PowerUL", ""),
            powerLL: getValue("PowerLL", ""),
            toneUR: getValue("ToneUR", ""),
            toneLR: getValue("ToneLR", ""),
            toneUL: getValue("ToneUL", ""),
            toneLL: getValue("ToneLL", ""),
            reflexesUR: getValue("ReflexesUR", ""),
            reflexesLR: getValue("ReflexesLR", ""),
            reflexesUL: getValue("ReflexesUL", ""),
            reflexesLL: getValue("ReflexesLL", ""),
            plantarUR: getValue("PlantarUR", ""),
            plantarLR: getValue("PlantarLR", ""),
            plantarUL: getValue("PlantarUL", ""),
            plantarLL: getValue("PlantarLL", ""),
            sensationUR: getValue("SensationUR", ""),
            sensationLR: getValue("SensationLR", ""),
            sensationUL: getValue("SensationUL", ""),
            sensationLL: getValue("SensationLL", ""),

            // Bones & Joints
            ricketsY: getValue("RicketsY", ""),
            ricketsN: getValue("RicketsN", ""),

            // Admission Diagnoses
            malaria1: getValue("Malaria1", ""),
            malaria2: getValue("Malaria2", ""),
            malariaSeverity: getValue("MalariaSeverity", ""),
            pneumonia1: getValue("Pneumonia1", ""),
            pneumonia2: getValue("Pneumonia2", ""),
            pneumoniaSeverity: getValue("PneumoniaSeverity", ""),
            diarrhoea1: getValue("Diarrhoea1", ""),
            diarrhoea2: getValue("Diarrhoea2", ""),
            diarrhoeaType: getValue("DiarrhoeaType", ""),
            dehydration1: getValue("Dehydration1", ""),
            dehydration2: getValue("Dehydration2", ""),
            dehydrationLevel: getValue("DehydrationLevel", ""),
            hivResult1: getValue("HivResult1", ""),
            hivResult2: getValue("HivResult2", ""),
            hivResultType: getValue("HivResultType", ""),
            malnutrition1: getValue("Malnutrition1", ""),
            malnutrition2: getValue("Malnutrition2", ""),
            malnutritionType: getValue("MalnutritionType", ""),
            suspectedTB1: getValue("SuspectedTB1", ""),
            suspectedTB2: getValue("SuspectedTB2", ""),
            suspectedTBSeverity: getValue("SuspectedTBSeverity", ""),
            prematurity1: getValue("Prematurity1", ""),
            prematurity2: getValue("Prematurity2", ""),
            neonatalSepsis1: getValue("NeonatalSepsis1", ""),
            neonatalSepsis2: getValue("NeonatalSepsis2", ""),
            other1: getValue("Other1", ""),
            other2: getValue("Other2", ""),
            otherSeverity: getValue("OtherSeverity", ""),
            anaemia1: getValue("Anaemia1", ""),
            anaemia2: getValue("Anaemia2", ""),
            anaemiaSeverity: getValue("AnaemiaSeverity", ""),
            sickleCell1: getValue("SickleCell1", ""),
            sickleCell2: getValue("SickleCell2", ""),
            sickleCellSeverity: getValue("SickleCellSeverity", ""),
            asthma1: getValue("Asthma1", ""),
            asthma2: getValue("Asthma2", ""),
            asthmaSeverity: getValue("AsthmaSeverity", ""),
            meningitis1: getValue("Meningitis1", ""),
            meningitis2: getValue("Meningitis2", ""),
            rickets1: getValue("Rickets1", ""),
            rickets2: getValue("Rickets2", ""),

            // Investigations
            malariaBloodSlide: getChecklistValue("MalariaBloodSlide"),
            malariaRapidTest: getChecklistValue("MalariaRapidTest"),
            haemHb: getChecklistValue("HaemHb"),
            haemFullHaemogram: getChecklistValue("HaemFullHaemogram"),
            chemGlucose: getChecklistValue("ChemGlucose"),
            chemStickTest: getChecklistValue("ChemStickTest"),
            labNaK: getChecklistValue("LabNaK"),
            labUE: getChecklistValue("LabUE"),
            labCaP: getChecklistValue("LabCaP"),
            labAb: getChecklistValue("LabAb"),
            labLFT: getChecklistValue("LabLFT"),
            microLP: getChecklistValue("MicroLP"),
            microBloodCulture: getChecklistValue("MicroBloodCulture"),
            hivRapid: getChecklistValue("HivRapid"),
            hivpcr: getChecklistValue("Hivpcr"),
            xrayCXR: getChecklistValue("XrayCXR"),
            xrayWrist: getChecklistValue("XrayWrist"),
            xrayWristOther: getValue("XrayWristOther", ""),
            urineUrinalysis: getChecklistValue("UrineUrinalysis"),
            urineMicroCulture: getChecklistValue("UrineMicroCulture"),
            tbMicroAFB: getChecklistValue("TbMicroAFB"),
            tbMantoux: getChecklistValue("TbMantoux"),
            stoolMicroscopy: getChecklistValue("StoolMicroscopy"),
            stoolMicroCulture: getChecklistValue("StoolMicroCulture"),
            otherinvestigation: getValue("Otherinvestigation", ""),

            // Clinician Details
            clinicianName: getValue("ClinicianName", ""),
            date: getValue("Date", ""),
            time: getValue("Time", ""),
        };
    };

    const handleEditPaediatricAdmissionRecord = async (id) => {
        try {
            const response = await EditPaediatricAdmissionRecord(id)
            console.log("Edit API Response:", response);

            if (response.success) {
                const data = response.data[0];

                // Create a new object with patient info from props + mapped edit data
                const updatedValues = {
                    ...initialValues,  // Start with fresh initial values
                    // Keep patient info from props
                    patientID: data?.patientID || values.patientID,
                    name: data?.name || values.name,
                    contactTel: data?.contactTel || values.contactTel,
                    admissionDate: data?.admissionDate || values.admissionDate,
                    transactionId: data?.transactionId || values.transactionId,
                    ipNo: data?.ipNo || values.ipNo,
                    // Override with fetched edit data
                    ...mapEditValues(data)
                };

                setValues(updatedValues);
            } else {
                notify(t("No data found"), "warning");
            }
        } catch (error) {
            console.error("Edit error:", error);
            notify(error?.message || "Failed to load record", "error");
        }
    };

    const handleSave = async () => {
        // Ensure all checklist fields are included in payload
        const payload = {
            ...values,
            TransactionID: data?.transactionID,  // Make sure transactionID is included
            PatientID: data?.patientID,          // Make sure patientID is included
        };

        // Add all checklist fields if they're not already in payload
        Object.keys(checklistOptions).forEach(section => {
            checklistOptions[section].forEach(opt => {
                if (payload[opt.code] === undefined) {
                    payload[opt.code] = "0";
                }
            });
        });

        if (values?.id && values.id !== "0") {
            try {
                const response = await UpdatePaediatricAdmissionRecord(payload)
                if (response.success) {
                    notify(response?.message, "success")
                    getdataPaediatricAdmissionRecord()
                    setValues({ ...initialValues })
                }
            } catch (error) {
                notify(error?.message, "error")
            }
        } else {
            try {
                const response = await SavePaediatricAdmissionRecord(payload)
                if (response.success) {
                    notify(response?.message, "success")
                    getdataPaediatricAdmissionRecord()
                    setValues({ ...initialValues })
                }
            } catch (error) {
                notify(error?.message, "error")
            }
        }
    }

    useEffect(() => {
        getdataPaediatricAdmissionRecord()

        setValues(initialValues)

        return () => {
            // Cleanup on unmount
            setValues(initialValues)
        }
    }, [])

    // Table configurations
    const THEAD = [
        { name: t("Vaccine") },
        { name: t("BCG") },
        { name: t("OPV") },
        { name: t("IPV") },
        { name: t("Pentavalent") },
        { name: t("Pneumo") },
        { name: t("Rota") },
        { name: t("Measles") },
        { name: t("MR") },
    ];
    const ApiTHEAD = [
        { name: t("S.No"), width: "4%" },
        { name: t("Weight") },
        { name: t("Height/Length") },
        { name: t("Created By") },
        { name: t("Action"), width: "4%" },
    ];

    const THEADAdmissionDiagnoses = [
        { name: t("Disease"), width: "4%" },
        { name: t("1"), width: "20%" },
        { name: t("2"), width: "20%" },
        { name: t("Severity / Type Options") },
    ];

    // Radio button component - FIXED
    const RadioButton = ({ name, label, value, checked, onChange, className = "" }) => (
        <div className={`d-flex align-items-center me-3 ${className}`}>
            <input
                type="radio"
                name={name}
                id={`${name}_${value}`}
                className="mx-2"
                value={value}
                checked={checked === true || checked === "1" || checked === value}
                onChange={() => onChange(name, value)}
            />
            <label htmlFor={`${name}_${value}`} className="mx-2 mb-0">
                {label}
            </label>
        </div>
    );

    // Optimized table body for admission diagnoses
    const tBodyAdmissionDiagnoses = [
        {
            vaccine: "Malaria",
            col1: (
                <RadioButton
                    name="malaria"
                    label=""
                    value="1"
                    checked={values?.malaria1 === "1"}
                    onChange={handleRadioChange}
                />
            ),
            col2: (
                <RadioButton
                    name="malaria"
                    label=""
                    value="2"
                    checked={values?.malaria2 === "2"}
                    onChange={handleRadioChange}
                />
            ),
            severity: (
                <div className="d-flex">
                    <RadioButton
                        name="malariaSeverity"
                        label={t("Severe")}
                        value="severe"
                        checked={values?.malariaSeverity === "severe"}
                        onChange={handleRadioChange}
                    />
                    <RadioButton
                        name="malariaSeverity"
                        label={t("Non-severe")}
                        value="non-severe"
                        checked={values?.malariaSeverity === "non-severe"}
                        onChange={handleRadioChange}
                    />
                </div>
            ),
        },

        {
            vaccine: "Anaemia",
            col1: (
                <RadioButton
                    name="anaemia"
                    label=""
                    value="1"
                    checked={values?.anaemia1 === "1"}
                    onChange={handleRadioChange}
                />
            ),
            col2: (
                <RadioButton
                    name="anaemia"
                    label=""
                    value="2"
                    checked={values?.anaemia2 === "2"}
                    onChange={handleRadioChange}
                />
            ),
            severity: (
                <div className="d-flex">
                    <RadioButton
                        name="anaemiaSeverity"
                        label={t("Severe")}
                        value="severe"
                        checked={values?.anaemiaSeverity === "severe"}
                        onChange={handleRadioChange}
                    />
                    <RadioButton
                        name="anaemiaSeverity"
                        label={t("Non-severe")}
                        value="non-severe"
                        checked={values?.anaemiaSeverity === "non-severe"}
                        onChange={handleRadioChange}
                    />
                </div>
            ),
        },

        {
            vaccine: "Pneumonia",
            col1: (
                <RadioButton
                    name="pneumonia"
                    label=""
                    value="1"
                    checked={values?.pneumonia1 === "1"}
                    onChange={handleRadioChange}
                />
            ),
            col2: (
                <RadioButton
                    name="pneumonia"
                    label=""
                    value="2"
                    checked={values?.pneumonia2 === "2"}
                    onChange={handleRadioChange}
                />
            ),
            severity: (
                <div className="d-flex">
                    <RadioButton
                        name="pneumoniaSeverity"
                        label={t("Severe")}
                        value="severe"
                        checked={values?.pneumoniaSeverity === "severe"}
                        onChange={handleRadioChange}
                    />
                    <RadioButton
                        name="pneumoniaSeverity"
                        label={t("Non-severe")}
                        value="non-severe"
                        checked={values?.pneumoniaSeverity === "non-severe"}
                        onChange={handleRadioChange}
                    />
                </div>
            ),
        },

        {
            vaccine: "Diarrhoea",
            col1: (
                <RadioButton
                    name="diarrhoea"
                    label=""
                    value="1"
                    checked={values?.diarrhoea1 === "1"}
                    onChange={handleRadioChange}
                />
            ),
            col2: (
                <RadioButton
                    name="diarrhoea"
                    label=""
                    value="2"
                    checked={values?.diarrhoea2 === "2"}
                    onChange={handleRadioChange}
                />
            ),
            severity: (
                <div className="d-flex">
                    <RadioButton
                        name="diarrhoeaType"
                        label={t("Non-bloody")}
                        value="non-bloody"
                        checked={values?.diarrhoeaType === "non-bloody"}
                        onChange={handleRadioChange}
                    />
                    <RadioButton
                        name="diarrhoeaType"
                        label={t("Bloody (dysentery)")}
                        value="bloody"
                        checked={values?.diarrhoeaType === "bloody"}
                        onChange={handleRadioChange}
                    />
                </div>
            ),
        },

        {
            vaccine: "Dehydration",
            col1: (
                <RadioButton
                    name="dehydration"
                    label=""
                    value="1"
                    checked={values?.dehydration1 === "1"}
                    onChange={handleRadioChange}
                />
            ),
            col2: (
                <RadioButton
                    name="dehydration"
                    label=""
                    value="2"
                    checked={values?.dehydration2 === "2"}
                    onChange={handleRadioChange}
                />
            ),
            severity: (
                <div className="d-flex flex-wrap">
                    <RadioButton
                        name="dehydrationLevel"
                        label={t("Shock")}
                        value="shock"
                        checked={values?.dehydrationLevel === "shock"}
                        onChange={handleRadioChange}
                    />
                    <RadioButton
                        name="dehydrationLevel"
                        label={t("Severe")}
                        value="severe"
                        checked={values?.dehydrationLevel === "severe"}
                        onChange={handleRadioChange}
                    />
                    <RadioButton
                        name="dehydrationLevel"
                        label={t("Some")}
                        value="some"
                        checked={values?.dehydrationLevel === "some"}
                        onChange={handleRadioChange}
                    />
                    <RadioButton
                        name="dehydrationLevel"
                        label={t("None")}
                        value="none"
                        checked={values?.dehydrationLevel === "none"}
                        onChange={handleRadioChange}
                    />
                </div>
            ),
        },

        {
            vaccine: "HIV Result",
            col1: (
                <RadioButton
                    name="hivResult"
                    label=""
                    value="1"
                    checked={values?.hivResult1 === "1"}
                    onChange={handleRadioChange}
                />
            ),
            col2: (
                <RadioButton
                    name="hivResult"
                    label=""
                    value="2"
                    checked={values?.hivResult2 === "2"}
                    onChange={handleRadioChange}
                />
            ),
            severity: (
                <div className="d-flex flex-wrap">
                    <RadioButton name="hivResultType" label={t("Positive")} value="positive" checked={values?.hivResultType === "positive"} onChange={handleRadioChange} />
                    <RadioButton name="hivResultType" label={t("Exposed (PMTCT+)")} value="exposed" checked={values?.hivResultType === "exposed"} onChange={handleRadioChange} />
                    <RadioButton name="hivResultType" label={t("Negative")} value="negative" checked={values?.hivResultType === "negative"} onChange={handleRadioChange} />
                    <RadioButton name="hivResultType" label={t("Declined Test")} value="declined" checked={values?.hivResultType === "declined"} onChange={handleRadioChange} />
                </div>
            ),
        },
        {
            vaccine: "Malnutrition",
            col1: (<RadioButton name="malnutrition" label="" value="1" checked={values?.malnutrition1 === "1"} onChange={handleRadioChange} />),
            col2: (<RadioButton name="malnutrition" label="" value="2" checked={values?.malnutrition2 === "2"} onChange={handleRadioChange} />),
            severity: (<div className="d-flex flex-wrap"> <RadioButton name="malnutritionType" label={t("Kwashiorkor")} value="kwashiorkor" checked={values?.malnutritionType === "kwashiorkor"} onChange={handleRadioChange} /> <RadioButton name="malnutritionType" label={t("Marasmus")} value="marasmus" checked={values?.malnutritionType === "marasmus"} onChange={handleRadioChange} /> <RadioButton name="malnutritionType" label={t("M.Kwash")} value="mkwash" checked={values?.malnutritionType === "mkwash"} onChange={handleRadioChange} /> <RadioButton name="malnutritionType" label={t("Moderate Malnutrition")} value="moderate" checked={values?.malnutritionType === "moderate"} onChange={handleRadioChange} /> <RadioButton name="malnutritionType" label={t("Mild/None")} value="mild" checked={values?.malnutritionType === "mild"} onChange={handleRadioChange} /> </div>),
        },
        {
            vaccine: "Suspected TB",
            col1: (
                <RadioButton
                    name="suspectedTB"
                    label=""
                    value="1"
                    checked={values?.suspectedTB1 === "1"}
                    onChange={handleRadioChange}
                />
            ),
            col2: (
                <RadioButton
                    name="suspectedTB"
                    label=""
                    value="2"
                    checked={values?.suspectedTB2 === "2"}
                    onChange={handleRadioChange}
                />
            ),
            severity: (<div></div>),
        },
        {
            vaccine: "prematurity / LBW",
            col1: (
                <RadioButton
                    name="prematurity"
                    label=""
                    value="1"
                    checked={values?.prematurity1 === "1"}
                    onChange={handleRadioChange}
                />
            ),
            col2: (
                <RadioButton
                    name="prematurity"
                    label=""
                    value="2"
                    checked={values?.prematurity2 === "2"}
                    onChange={handleRadioChange}
                />
            ),
            severity: (<div></div>),
        },
        {
            vaccine: "Neonatal Sepsis",
            col1: (
                <RadioButton
                    name="neonatalSepsis"
                    label=""
                    value="1"
                    checked={values?.neonatalSepsis1 === "1"}
                    onChange={handleRadioChange}
                />
            ),
            col2: (
                <RadioButton
                    name="neonatalSepsis"
                    label=""
                    value="2"
                    checked={values?.neonatalSepsis2 === "2"}
                    onChange={handleRadioChange}
                />
            ),
            severity: (<div></div>),
        },
        {
            vaccine: "Other",
            col1: (
                <RadioButton
                    name="other"
                    label=""
                    value="1"
                    checked={values?.other1 === "1"}
                    onChange={handleRadioChange}
                />
            ),
            col2: (
                <RadioButton
                    name="other"
                    label=""
                    value="2"
                    checked={values?.other2 === "2"}
                    onChange={handleRadioChange}
                />
            ),
            severity: (<div></div>),
        },
        {
            vaccine: "Other",
            col1: (
                <RadioButton
                    name="other"
                    label=""
                    value="1"
                    checked={values?.other1 === "1"}
                    onChange={handleRadioChange}
                />
            ),
            col2: (
                <RadioButton
                    name="other"
                    label=""
                    value="2"
                    checked={values?.other2 === "2"}
                    onChange={handleRadioChange}
                />
            ),
            severity: (<div></div>),
        },
        {
            vaccine: "Sickle Cell",
            col1: (
                <RadioButton
                    name="sickleCell"
                    label=""
                    value="1"
                    checked={values?.sickleCell1 === "1"}
                    onChange={handleRadioChange}
                />
            ),
            col2: (
                <RadioButton
                    name="sickleCell"
                    label=""
                    value="2"
                    checked={values?.sickleCell2 === "2"}
                    onChange={handleRadioChange}
                />
            ),
            severity: (<div></div>),
        },
        {
            vaccine: "Asthma",
            col1: (
                <RadioButton
                    name="asthma"
                    label=""
                    value="1"
                    checked={values?.asthma1 === "1"}
                    onChange={handleRadioChange}
                />
            ),
            col2: (
                <RadioButton
                    name="asthma"
                    label=""
                    value="2"
                    checked={values?.asthma2 === "2"}
                    onChange={handleRadioChange}
                />
            ),
            severity: (<div></div>),
        },
        {
            vaccine: "Meningitis",
            col1: (
                <RadioButton
                    name="meningitis"
                    label=""
                    value="1"
                    checked={values?.meningitis1 === "1"}
                    onChange={handleRadioChange}
                />
            ),
            col2: (
                <RadioButton
                    name="meningitis"
                    label=""
                    value="2"
                    checked={values?.meningitis2 === "2"}
                    onChange={handleRadioChange}
                />
            ),
            severity: (<div></div>),
        },
        {
            vaccine: "Rickets",
            col1: (
                <RadioButton
                    name="rickets"
                    label=""
                    value="1"
                    checked={values?.rickets1 === "1"}
                    onChange={handleRadioChange}
                />
            ),
            col2: (
                <RadioButton
                    name="rickets"
                    label=""
                    value="2"
                    checked={values?.rickets2 === "2"}
                    onChange={handleRadioChange}
                />
            ),
            severity: (<div></div>),
        }
    ];


    const tBody = [
        {
            vaccine: "No. of doses",
            Bcg: (
                <Input
                    type="text"
                    id="noBCG"
                    name="noBCG"
                    value={values?.noBCG || ""}
                    onChange={handleChange}
                    className="form-control"
                    respclass={"mt-2"}
                />
            ),
            opv: (
                <Input
                    type="text"
                    id="noOPV"
                    name="noOPV"
                    value={values?.noOPV || ""}
                    onChange={handleChange}
                    className="form-control"
                    respclass={"mt-2"}
                />
            ),
            ipv: (
                <Input
                    type="text"
                    id="noIPV"
                    name="noIPV"
                    value={values?.noIPV || ""}
                    onChange={handleChange}
                    className="form-control"
                    respclass={"mt-2"}
                />
            ),
            Pentavalent: (
                <Input
                    type="text"
                    id="noPentavalent"
                    name="noPentavalent"
                    value={values?.noPentavalent || ""}
                    onChange={handleChange}
                    className="form-control"
                    respclass={"mt-2"}
                />
            ),
            Pneumo: (
                <Input
                    type="text"
                    id="noPneumo"
                    name="noPneumo"
                    value={values?.noPneumo || ""}
                    onChange={handleChange}
                    className="form-control"
                    respclass={"mt-2"}
                />
            ),
            Rota: (
                <Input
                    type="text"
                    id="noRota"
                    name="noRota"
                    value={values?.noRota || ""}
                    onChange={handleChange}
                    className="form-control"
                    respclass={"mt-2"}
                />
            ),
            Measles: (
                <Input
                    type="text"
                    id="noMeasles"
                    name="noMeasles"
                    value={values?.noMeasles || ""}
                    onChange={handleChange}
                    className="form-control"
                    respclass={"mt-2"}
                />
            ),
            MR: (
                <Input
                    type="text"
                    id="noMR"
                    name="noMR"
                    value={values?.noMR || ""}
                    onChange={handleChange}
                    className="form-control"
                    respclass={"mt-2"}
                />
            )
        },
    ]

    const tBody1 = [
        {
            label: t("Power:"),
            rightUpper: (
                <Input
                    type="text"
                    className="form-control"
                    placeholder=""
                    name="powerUR"
                    value={values?.powerUR || ""}
                    onChange={handleChange}
                />
            ),
            rightLower: (
                <Input
                    type="text"
                    className="form-control"
                    placeholder=""
                    name="powerLR"
                    value={values?.powerLR || ""}
                    onChange={handleChange}
                />
            ),
            leftUpper: (
                <Input
                    type="text"
                    className="form-control"
                    placeholder=""
                    name="powerUL"
                    value={values?.powerUL || ""}
                    onChange={handleChange}
                />
            ),
            leftLower: (
                <Input
                    type="text"
                    className="form-control"
                    placeholder=""
                    name="powerLL"
                    value={values?.powerLL || ""}
                    onChange={handleChange}
                />
            ),
        },
        {
            label: t("Tone:"),
            rightUpper: (
                <Input
                    type="text"
                    className="form-control"
                    placeholder=""
                    name="toneUR"
                    value={values?.toneUR || ""}
                    onChange={handleChange}
                />
            ),
            rightLower: (
                <Input
                    type="text"
                    className="form-control"
                    placeholder=""
                    name="toneLR"
                    value={values?.toneLR || ""}
                    onChange={handleChange}
                />
            ),
            leftUpper: (
                <Input
                    type="text"
                    className="form-control"
                    placeholder=""
                    name="toneUL"
                    value={values?.toneUL || ""}
                    onChange={handleChange}
                />
            ),
            leftLower: (
                <Input
                    type="text"
                    className="form-control"
                    placeholder=""
                    name="toneLL"
                    value={values?.toneLL || ""}
                    onChange={handleChange}
                />
            ),
        },
        {
            label: t("Reflexes:"),
            rightUpper: (
                <Input
                    type="text"
                    className="form-control"
                    placeholder=""
                    name="reflexesUR"
                    value={values?.reflexesUR || ""}
                    onChange={handleChange}
                />
            ),
            rightLower: (
                <Input
                    type="text"
                    className="form-control"
                    placeholder=""
                    name="reflexesLR"
                    value={values?.reflexesLR || ""}
                    onChange={handleChange}
                />
            ),
            leftUpper: (
                <Input
                    type="text"
                    className="form-control"
                    placeholder=""
                    name="reflexesUL"
                    value={values?.reflexesUL || ""}
                    onChange={handleChange}
                />
            ),
            leftLower: (
                <Input
                    type="text"
                    className="form-control"
                    placeholder=""
                    name="reflexesLL"
                    value={values?.reflexesLL || ""}
                    onChange={handleChange}
                />
            ),
        },
        {
            label: t("Plantar responses:"),
            rightUpper: (
                <Input
                    type="text"
                    className="form-control"
                    placeholder=""
                    name="plantarUR"
                    value={values?.plantarUR || ""}
                    onChange={handleChange}
                />
            ),
            rightLower: (
                <Input
                    type="text"
                    className="form-control"
                    placeholder=""
                    name="plantarLR"
                    value={values?.plantarLR || ""}
                    onChange={handleChange}
                />
            ),
            leftUpper: (
                <Input
                    type="text"
                    className="form-control"
                    placeholder=""
                    name="plantarUL"
                    value={values?.plantarUL || ""}
                    onChange={handleChange}
                />
            ),
            leftLower: (
                <Input
                    type="text"
                    className="form-control"
                    placeholder=""
                    name="plantarLL"
                    value={values?.plantarLL || ""}
                    onChange={handleChange}
                />
            ),
        },
        {
            label: t("Sensation:"),
            rightUpper: (
                <Input
                    type="text"
                    className="form-control"
                    placeholder=""
                    name="sensationUR"
                    value={values?.sensationUR || ""}
                    onChange={handleChange}
                />
            ),
            rightLower: (
                <Input
                    type="text"
                    className="form-control"
                    placeholder=""
                    name="sensationLR"
                    value={values?.sensationLR || ""}
                    onChange={handleChange}
                />
            ),
            leftUpper: (
                <Input
                    type="text"
                    className="form-control"
                    placeholder=""
                    name="sensationUL"
                    value={values?.sensationUL || ""}
                    onChange={handleChange}
                />
            ),
            leftLower: (
                <Input
                    type="text"
                    className="form-control"
                    placeholder=""
                    name="sensationLL"
                    value={values?.sensationLL || ""}
                    onChange={handleChange}
                />
            ),
        },
    ];

    const debugValues = () => {
        console.log("Current values:", values);
        console.log("Readmission - Y:", values.readY, "N:", values.readN);
        console.log("Fever - Y:", values.feverY, "N:", values.feverN);
        console.log("Weight:", values.weight);
    };

    return (
        <>
            <form className="card patient_registration border mt-1">
                <Heading
                    title={t("Paediatric Admission Record")}
                    isBreadcrumb={false}
                />

                {/* Debug button - remove in production */}
                {/* <button 
                    type="button" 
                    className="btn btn-sm btn-info mb-2"
                    onClick={debugValues}
                    style={{position: 'absolute', right: '10px', top: '10px'}}
                >
                    Debug
                </button> */}

                <div className="row p-2">
                    <div className="col-12">
                        <div className="row">
                            <ReactSelect
                                placeholderName={t("Readmission to this hospital ?")}
                                searchable={true}
                                respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                id="readmission"
                                name="readmission"
                                value={
                                    getYesNoValue(values.readY, values.readN)
                                }
                                removeIsClearable={false}
                                dynamicOptions={YES_NO}
                                handleChange={(name, val) =>
                                    handleYesNoRadio("read", val?.value)
                                }
                            />

                            <ReactSelect
                                placeholderName={t("Discharge < 1 month ago")}
                                searchable={true}
                                respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                id="discharge"
                                name="discharge"
                                value={
                                    getYesNoValue(values.dischargemonthY, values.dischargemonthN)
                                }
                                removeIsClearable={false}
                                dynamicOptions={YES_NO}
                                handleChange={(name, val) => handleYesNoRadio("dischargemonth", val?.value)}
                            />
                            <div className="col-xl-4 col-md-6 col-sm-6 col-12 mt-1">
                                <TextAreaInput
                                    className="form-control"
                                    lable={t("Presenting Complaints")}
                                    placeholder={""}
                                    name="presentingComplaints"
                                    id="presentingComplaints"
                                    rows={4}
                                    value={values?.presentingComplaints || ""}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <Heading
                            title={t("History & Examination")}
                            isBreadcrumb={false}
                        />

                        <div className='row py-2'>
                            <Input
                                lable={t("Weight")}
                                placeholder={""}
                                type="number"
                                id="weight"
                                name="weight"
                                value={values?.weight || ""}
                                onChange={handleChange}
                                className="form-control"
                                respclass={"col-xl-2 col-md-4 col-sm-4 col-12"}
                            />
                            <Input
                                lable={t("Height/Length")}
                                placeholder={""}
                                type="number"
                                id="heightLength"
                                name="heightLength"
                                value={values?.heightLength || ""}
                                onChange={handleChange}
                                className="form-control"
                                respclass={"col-xl-2 col-md-4 col-sm-4 col-12"}
                            />
                            <Input
                                lable={t("WHZscore")}
                                placeholder={""}
                                type="number"
                                id="whZscore"
                                name="whZscore"
                                value={values?.whZscore || ""}
                                onChange={handleChange}
                                className="form-control"
                                respclass={"col-xl-2 col-md-4 col-sm-4 col-12"}
                            />
                            <Input
                                lable={t("MUAC(cm)")}
                                placeholder={""}
                                type="number"
                                id="muaCcm"
                                name="muaCcm"
                                value={values?.muaCcm || ""}
                                onChange={handleChange}
                                className="form-control"
                                respclass={"col-xl-2 col-md-4 col-sm-4 col-12"}
                            />
                            <Input
                                lable={t("Head Circum (cm)")}
                                placeholder={""}
                                type="number"
                                id="headCirc"
                                name="headCirc"
                                value={values?.headCirc || ""}
                                onChange={handleChange}
                                className="form-control"
                                respclass={"col-xl-2 col-md-4 col-sm-4 col-12"}
                            />
                        </div>

                        <hr />
                        <hr />

                        <div className="row py-2">
                            <Input
                                lable={t("Length of illness (days)")}
                                placeholder={""}
                                type="number"
                                id="lengthIllnessDays"
                                name="lengthIllnessDays"
                                value={values?.lengthIllnessDays || ""}
                                onChange={handleChange}
                                className="form-control"
                                respclass={"col-xl-2 col-md-4 col-sm-4 col-12"}
                            />
                            <ReactSelect
                                placeholderName={t("Fever - No. of days")}
                                searchable={true}
                                respclass={`${"col-xl-2 col-md-4 col-sm-4 col-12 "}`}
                                id="fever"
                                name="fever"
                                value={
                                    getYesNoValue(values.feverY, values.feverN)
                                }
                                removeIsClearable={false}
                                dynamicOptions={YES_NO}
                                handleChange={(name, val) => handleYesNoRadio("fever", val?.value)}
                            />
                            {values?.feverY === "1" && (
                                <Input
                                    lable={t("No. of days")}
                                    placeholder=""
                                    type="number"
                                    id="feverDays"
                                    name="feverDays"
                                    value={values?.feverDays || ""}
                                    onChange={handleChange}
                                    className="form-control"
                                    respclass="col-xl-1 col-md-2 col-sm-2 col-6"
                                />
                            )}

                            <ReactSelect
                                placeholderName={t("Cough - No. of days")}
                                searchable={true}
                                respclass={`${"col-xl-2 col-md-4 col-sm-4 col-12 "}`}
                                id="cough"
                                name="cough"
                                value={
                                    getYesNoValue(values.coughY, values.coughN)
                                }
                                removeIsClearable={false}
                                dynamicOptions={YES_NO}
                                handleChange={(name, val) => handleYesNoRadio("cough", val?.value)}
                            />
                            {values?.coughY === "1" && (
                                <Input
                                    lable={t("No. of days")}
                                    placeholder=""
                                    type="number"
                                    id="coughDays"
                                    name="coughDays"
                                    value={values?.coughDays || ""}
                                    onChange={handleChange}
                                    className="form-control"
                                    respclass="col-xl-1 col-md-2 col-sm-2 col-6"
                                />
                            )}
                            <ReactSelect
                                placeholderName={t("Cough > 2 weeks")}
                                searchable={true}
                                respclass={`${/* values?.coughGT2WeeksY === "1" ? "col-xl-1 col-md-2 col-sm-2 col-6 " :  */"col-xl-2 col-md-4 col-sm-4 col-12 "}`}
                                id="coughGT2Weeks"
                                name="coughGT2Weeks"
                                value={
                                    getYesNoValue(values.coughGT2WeeksY, values.coughGT2WeeksN)
                                }
                                removeIsClearable={false}
                                dynamicOptions={YES_NO}
                                handleChange={(name, val) => handleYesNoRadio("coughGT2Weeks", val?.value)}
                            />
                            {values?.coughGT2WeeksY === "1" && (
                                <Input
                                    lable={t("No. of days")}
                                    placeholder=""
                                    type="number"
                                    id="coughGT2WeeksNo"
                                    name="coughGT2WeeksNo"
                                    value={values?.coughGT2WeeksNo || ""}
                                    onChange={handleChange}
                                    className="form-control"
                                    respclass="col-xl-1 col-md-2 col-sm-2 col-6"
                                />
                            )}
                            {console.log(values.coughLast2BChronicY)}

                            <ReactSelect
                                placeholderName={t("Con with TB /Chronic Cough (lst 12 mon)")}
                                searchable={true}
                                respclass={`${/* values?.coughLast2BChronicY === "1" ? "col-xl-1 col-md-2 col-sm-2 col-6 " : */ "col-xl-2 col-md-4 col-sm-4 col-12 "}`}
                                id="coughChronic"
                                name="coughChronic"
                                value={
                                    getYesNoValue(values.coughLast2BChronicY, values.coughLast2BChronicN)
                                }
                                removeIsClearable={false}
                                dynamicOptions={YES_NO}
                                handleChange={(name, val) => handleYesNoRadio("coughLast2BChronic", val?.value)}
                            />
                            {values?.coughLast2BChronicY === "1" && (
                                <Input
                                    lable={t("No. of days")}
                                    placeholder=""
                                    type="number"
                                    id="coughChronicNo"
                                    name="coughChronicNo"
                                    value={values?.coughChronicNo || ""}
                                    onChange={handleChange}
                                    className="form-control"
                                    respclass="col-xl-1 col-md-2 col-sm-2 col-6"
                                />
                            )}
                            <ReactSelect
                                placeholderName={t("Difficulty breathing")}
                                searchable={true}
                                respclass={`${/* values?.difficultyBreathingY === "1" ? "col-xl-1 col-md-2 col-sm-2 col-6 " :  */"col-xl-2 col-md-4 col-sm-4 col-12 "}`}
                                id="difficultyBreathing"
                                name="difficultyBreathing"
                                value={
                                    getYesNoValue(values.difficultyBreathingY, values.difficultyBreathingN)
                                }
                                removeIsClearable={false}
                                dynamicOptions={YES_NO}
                                handleChange={(name, val) => handleYesNoRadio("difficultyBreathing", val?.value)}
                            />
                            {values?.difficultyBreathingY === "1" && (
                                <Input
                                    lable={t("No. of days")}
                                    placeholder=""
                                    type="number"
                                    id="difficultyBreathingNo"
                                    name="difficultyBreathingNo"
                                    value={values?.difficultyBreathingNo || ""}
                                    onChange={handleChange}
                                    className="form-control"
                                    respclass="col-xl-1 col-md-2 col-sm-2 col-6"
                                />
                            )}
                            <ReactSelect
                                placeholderName={t("Diarrhoea - No. of days")}
                                searchable={true}
                                respclass={`${/* values?.diarrhoeaY === "1" ? "col-xl-1 col-md-2 col-sm-2 col-6 " : */ "col-xl-2 col-md-4 col-sm-4 col-12 "}`}
                                id="diarrhoea"
                                name="diarrhoea"
                                value={
                                    getYesNoValue(values.diarrhoeaY, values.diarrhoeaN)
                                }
                                removeIsClearable={false}
                                dynamicOptions={YES_NO}
                                handleChange={(name, val) => handleYesNoRadio("diarrhoea", val?.value)}
                            />
                            {values?.diarrhoeaY === "1" && (
                                <Input
                                    lable={t("No. of days")}
                                    placeholder=""
                                    type="number"
                                    id="diarrhoeaDays"
                                    name="diarrhoeaDays"
                                    value={values?.diarrhoeaDays || ""}
                                    onChange={handleChange}
                                    className="form-control"
                                    respclass="col-xl-1 col-md-2 col-sm-2 col-6"
                                />
                            )}
                            <ReactSelect
                                placeholderName={t("Diarrhoea > 14 days")}
                                searchable={true}
                                respclass={`${/* values?.diarrhoeaGT14dY === "1" ? "col-xl-1 col-md-2 col-sm-2 col-6 " : */ "col-xl-2 col-md-4 col-sm-4 col-12 "}`}
                                id="diarrhoeaGT14d"
                                name="diarrhoeaGT14d"
                                value={
                                    getYesNoValue(values.diarrhoeaGT14dY, values.diarrhoeaGT14dN)
                                }
                                removeIsClearable={false}
                                dynamicOptions={YES_NO}
                                handleChange={(name, val) => handleYesNoRadio("diarrhoeaGT14d", val?.value)}
                            />
                            {values?.diarrhoeaGT14dY === "1" && (
                                <Input
                                    lable={t("No. of days")}
                                    placeholder=""
                                    type="number"
                                    id="diarrhoeaGT14dNo"
                                    name="diarrhoeaGT14dNo"
                                    value={values?.diarrhoeaGT14dNo || ""}
                                    onChange={handleChange}
                                    className="form-control"
                                    respclass="col-xl-1 col-md-2 col-sm-2 col-6"
                                />
                            )}

                            <ReactSelect
                                placeholderName={t("Diarrhoea bloody")}
                                searchable={true}
                                respclass={`${/* values?.diarrhoeabloodyY === "1" ? "col-xl-1 col-md-2 col-sm-2 col-6 " : */ "col-xl-2 col-md-4 col-sm-4 col-12 "}`}
                                id="diarrhoeabloody"
                                name="diarrhoeabloody"
                                value={
                                    getYesNoValue(values.diarrhoeabloodyY, values.diarrhoeabloodyN)
                                }
                                removeIsClearable={false}
                                dynamicOptions={YES_NO}
                                handleChange={(name, val) => handleYesNoRadio("diarrhoeabloody", val?.value)}
                            />
                            {values?.diarrhoeabloodyY === "1" && (
                                <Input
                                    lable={t("No. of days")}
                                    placeholder=""
                                    type="number"
                                    id="diarrhoeabloodyDays"
                                    name="diarrhoeabloodyDays"
                                    value={values?.diarrhoeabloodyDays || ""}
                                    onChange={handleChange}
                                    className="form-control"
                                    respclass="col-xl-1 col-md-2 col-sm-2 col-6"
                                />
                            )}
                            <ReactSelect
                                placeholderName={t("Vomits Everything")}
                                searchable={true}
                                respclass={`${/* values?.vomitingY === "1" ? "col-xl-1 col-md-2 col-sm-2 col-6 " : */ "col-xl-2 col-md-4 col-sm-4 col-12 "}`}
                                id="vomiting"
                                name="vomiting"
                                value={
                                    getYesNoValue(values.vomitingY, values.vomitingN)
                                }
                                removeIsClearable={false}
                                dynamicOptions={YES_NO}
                                handleChange={(name, val) => handleYesNoRadio("vomiting", val?.value)}
                            />
                            {values?.vomitingY === "1" && (
                                <Input
                                    lable={t("No. of days")}
                                    placeholder=""
                                    type="number"
                                    id="vomitingNo24hrs"
                                    name="vomitingNo24hrs"
                                    value={values?.vomitingNo24hrs || ""}
                                    onChange={handleChange}
                                    className="form-control"
                                    respclass="col-xl-1 col-md-2 col-sm-2 col-6"
                                />
                            )}
                            <ReactSelect
                                placeholderName={t("Vomiting - No./24hrs")}
                                searchable={true}
                                respclass={`${/* values?.vomitingNot24hrsY === "1" ? "col-xl-1 col-md-2 col-sm-2 col-6 " : */ "col-xl-2 col-md-4 col-sm-4 col-12 "}`}
                                id="vomitingNot24hrs"
                                name="vomitingNot24hrs"
                                value={
                                    getYesNoValue(values.vomitingNot24hrsY, values.vomitingNot24hrsN)
                                }
                                removeIsClearable={false}
                                dynamicOptions={YES_NO}
                                handleChange={(name, val) => handleYesNoRadio("vomitingNot24hrs", val?.value)}
                            />
                            {values?.vomitingNot24hrsY === "1" && (
                                <Input
                                    lable={t("No. of days")}
                                    placeholder=""
                                    type="number"
                                    id="vomitingNot24hrsNo"
                                    name="vomitingNot24hrsNo"
                                    value={values?.vomitingNot24hrsNo || ""}
                                    onChange={handleChange}
                                    className="form-control"
                                    respclass="col-xl-1 col-md-2 col-sm-2 col-6"
                                />
                            )}
                            <ReactSelect
                                placeholderName={t("Difficult feeding")}
                                searchable={true}
                                respclass={`${/* values?.difficultFeedingY === "1" ? "col-xl-1 col-md-2 col-sm-2 col-6 " : */ "col-xl-2 col-md-4 col-sm-4 col-12 "}`}
                                id="difficultFeeding"
                                name="difficultFeeding"
                                value={
                                    getYesNoValue(values.difficultFeedingY, values.difficultFeedingN)
                                }
                                removeIsClearable={false}
                                dynamicOptions={YES_NO}
                                handleChange={(name, val) => handleYesNoRadio("difficultFeeding", val?.value)}
                            />
                            {values?.difficultFeedingY === "1" && (
                                <Input
                                    lable={t("No. of days")}
                                    placeholder=""
                                    type="number"
                                    id="difficultFeedingNo"
                                    name="difficultFeedingNo"
                                    value={values?.difficultFeedingNo || ""}
                                    onChange={handleChange}
                                    className="form-control"
                                    respclass="col-xl-1 col-md-2 col-sm-2 col-6"
                                />
                            )}
                            <ReactSelect
                                placeholderName={t("Convulsions last 24hrs")}
                                searchable={true}
                                respclass={`${/* values?.convulsionsLast24hrsY === "1" ? "col-xl-1 col-md-2 col-sm-2 col-6 " : */ "col-xl-2 col-md-4 col-sm-4 col-12 "}`}
                                id="convulsionsLast24hrs"
                                name="convulsionsLast24hrs"
                                value={
                                    getYesNoValue(values.convulsionsLast24hrsY, values.convulsionsLast24hrsN)
                                }
                                removeIsClearable={false}
                                dynamicOptions={YES_NO}
                                handleChange={(name, val) => handleYesNoRadio("convulsionsLast24hrs", val?.value)}
                            />
                            {values?.convulsionsLast24hrsY === "1" && (
                                <Input
                                    lable={t("No. of days")}
                                    placeholder=""
                                    type="number"
                                    id="numberLast24hrs"
                                    name="numberLast24hrs"
                                    value={values?.numberLast24hrs || ""}
                                    onChange={handleChange}
                                    className="form-control"
                                    respclass="col-xl-1 col-md-2 col-sm-2 col-6"
                                />
                            )}
                            <ReactSelect
                                placeholderName={t("Partial / focal fits")}
                                searchable={true}
                                respclass={`${/* values?.partialFocalFitsY === "1" ? "col-xl-1 col-md-2 col-sm-2 col-6 " :  */"col-xl-2 col-md-4 col-sm-4 col-12 "}`}
                                id="partialFocalFits"
                                name="partialFocalFits"
                                value={
                                    getYesNoValue(values.partialFocalFitsY, values.partialFocalFitsN)
                                }
                                removeIsClearable={false}
                                dynamicOptions={YES_NO}
                                handleChange={(name, val) => handleYesNoRadio("partialFocalFits", val?.value)}
                            />
                            {values?.partialFocalFitsY === "1" && (
                                <Input
                                    lable={t("No. of days")}
                                    placeholder=""
                                    type="number"
                                    id="partialFocalFits"
                                    name="partialFocalFits"
                                    value={values?.partialFocalFits || ""}
                                    onChange={handleChange}
                                    className="form-control"
                                    respclass="col-xl-1 col-md-2 col-sm-2 col-6"
                                />
                            )}
                        </div>

                        <Heading
                            title={t("Additional history of presenting illness")}
                            isBreadcrumb={false}
                        />

                        <div className='row py-2'>
                            <div className="col-xl-4 col-md-6 col-sm-6 col-12 mt-1">
                                <TextAreaInput
                                    className="form-control"
                                    lable={t("Additional history of")}
                                    placeholder={""}
                                    name="additionalHistory"
                                    id="additionalHistory"
                                    rows={4}
                                    value={values?.additionalHistory || ""}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="col-xl-4 col-md-6 col-sm-6 col-12 mt-1">
                                <TextAreaInput
                                    className="form-control disabled"
                                    lable={t("presenting illness")}
                                    placeholder={""}
                                    name="presentingIllness"
                                    id="presentingIllness"
                                    rows={4}
                                    value={values?.additionalHistory || ""}
                                    onChange={handleChange}
                                    disabled={true}
                                />
                            </div>
                        </div>

                        <Heading
                            title={t("Immunization")}
                            isBreadcrumb={false}
                        />

                        <div className='row py-2'>
                            <ReactSelect
                                placeholderName={t("Vaccine card available ?")}
                                searchable={true}
                                respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                id="vaccineCardavailable"
                                name="vaccineCardavailable"
                                value={
                                    getYesNoValue(values.vaccineCardavailableY, values.vaccineCardavailableN)
                                }
                                removeIsClearable={false}
                                dynamicOptions={YES_NO}
                                handleChange={(name, val) => handleYesNoRadio("vaccineCardavailable", val?.value)}
                            />

                            <div className='col-12'>
                                <Tables thead={THEAD} tbody={tBody} />
                            </div>

                            <ReactSelect
                                placeholderName={t("Vitamin A within last 6 months?")}
                                searchable={true}
                                respclass="col-xl-2 col-md-4 col-sm-4 col-12 mt-2"
                                id="vitaminA"
                                name="vitaminA"
                                value={
                                    getYesNoValue(values.vitaminAY, values.vitaminAN)
                                }
                                removeIsClearable={false}
                                dynamicOptions={YES_NO}
                                handleChange={(name, val) => handleYesNoRadio("vitaminA", val?.value)}
                            />
                        </div>

                        <Heading
                            title={t("Birth/Antenatal History")}
                            isBreadcrumb={false}
                        />

                        <div className='row py-2'>
                            <ReactSelect
                                placeholderName={t("Maternal PMTCT Status")}
                                searchable={true}
                                respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                id="pmtct"
                                name="pmtct"
                                value={
                                    getPosNegUnkValue(values.pmtctPos, values.pmtctNeg, values.pmtctUnk)
                                }
                                removeIsClearable={false}
                                dynamicOptions={POSITIVE_NEG_UNKNOWN}
                                handleChange={(name, val) => {
                                    setValues(prev => ({
                                        ...prev,
                                        pmtctPos: val?.value === "1" ? "1" : "",
                                        pmtctNeg: val?.value === "2" ? "1" : "",
                                        pmtctUnk: val?.value === "0" ? "1" : ""
                                    }))
                                }}
                            />

                            <div className="col-xl-2 col-md-4 col-sm-4 col-12">
                                <TextAreaInput
                                    className="form-control"
                                    lable={t("Growth and Development")}
                                    placeholder={""}
                                    name="growthDevelopment"
                                    id="growthDevelopment"
                                    rows={4}
                                    value={values?.growthDevelopment || ""}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="col-xl-2 col-md-4 col-sm-4 col-12">
                                <TextAreaInput
                                    className="form-control"
                                    lable={t("Family & Social History")}
                                    placeholder={""}
                                    name="familySocialHistory"
                                    id="familySocialHistory"
                                    rows={4}
                                    value={values?.familySocialHistory || ""}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="col-xl-2 col-md-4 col-sm-4 col-12">
                                <TextAreaInput
                                    className="form-control"
                                    lable={t("Nutritional History")}
                                    placeholder={""}
                                    name="nutritionalHistory"
                                    id="nutritionalHistory"
                                    rows={4}
                                    value={values?.nutritionalHistory || ""}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="col-xl-2 col-md-4 col-sm-4 col-12">
                                <TextAreaInput
                                    className="form-control"
                                    lable={t("Treatment history")}
                                    placeholder={""}
                                    name="treatmentHistory"
                                    id="treatmentHistory"
                                    rows={4}
                                    value={values?.treatmentHistory || ""}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <Heading
                            title={t("Review of Systems")}
                            isBreadcrumb={false}
                        />

                        <div className='row py-2'>
                            <div className="col-xl-2 col-md-4 col-sm-4 col-12">
                                <TextAreaInput
                                    className="form-control"
                                    lable={t("Respiratory including ENT")}
                                    placeholder={""}
                                    name="respiratoryENT"
                                    id="respiratoryENT"
                                    rows={4}
                                    value={values?.respiratoryENT || ""}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="col-xl-2 col-md-4 col-sm-4 col-12">
                                <TextAreaInput
                                    className="form-control"
                                    lable={t("Cardiovascular")}
                                    placeholder={""}
                                    name="cardiovascular"
                                    id="cardiovascular"
                                    rows={4}
                                    value={values?.cardiovascular || ""}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="col-xl-2 col-md-4 col-sm-4 col-12">
                                <TextAreaInput
                                    className="form-control"
                                    lable={t("Gastro intestinal / Genitourinary")}
                                    placeholder={""}
                                    name="gastrointestinalGU"
                                    id="gastrointestinalGU"
                                    rows={4}
                                    value={values?.gastrointestinalGU || ""}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="col-xl-2 col-md-4 col-sm-4 col-12">
                                <TextAreaInput
                                    className="form-control"
                                    lable={t("CNS")}
                                    placeholder={""}
                                    name="cns"
                                    id="cns"
                                    rows={4}
                                    value={values?.cns || ""}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <Heading
                            title={t("Vital Signs")}
                            isBreadcrumb={false}
                        />

                        <div className='row py-2'>
                            <Input
                                lable={t("Temp (°C)")}
                                placeholder={""}
                                type="text"
                                id="temp"
                                name="temp"
                                value={values?.temp || ""}
                                onChange={handleChange}
                                className="form-control"
                                respclass={"col-xl-2 col-md-4 col-sm-4 col-12"}
                            />

                            <Input
                                lable={t("Resp Rate (bpm)")}
                                placeholder={""}
                                type="text"
                                id="respRate"
                                name="respRate"
                                value={values?.respRate || ""}
                                onChange={handleChange}
                                className="form-control"
                                respclass={"col-xl-2 col-md-4 col-sm-4 col-12"}
                            />

                            <Input
                                lable={t("HR (/min)")}
                                placeholder={""}
                                type="text"
                                id="hr"
                                name="hr"
                                value={values?.hr || ""}
                                onChange={handleChange}
                                className="form-control"
                                respclass={"col-xl-2 col-md-4 col-sm-4 col-12"}
                            />

                            <Input
                                lable={t("O2 Sat (%)")}
                                placeholder={""}
                                type="text"
                                id="sat"
                                name="sat"
                                value={values?.sat || ""}
                                onChange={handleChange}
                                className="form-control"
                                respclass={"col-xl-2 col-md-4 col-sm-4 col-12"}
                            />

                            <Input
                                lable={t("BP (mmHg)")}
                                placeholder={""}
                                type="text"
                                id="bp"
                                name="bp"
                                value={values?.bp || ""}
                                onChange={handleChange}
                                className="form-control"
                                respclass={"col-xl-2 col-md-4 col-sm-4 col-12"}
                            />
                        </div>

                        <Heading
                            title={t("General Examination")}
                            isBreadcrumb={false}
                        />

                        <div className='row py-2'>
                            <ReactSelect
                                placeholderName={t("Oral thrush")}
                                searchable={true}
                                respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                id="oralThrush"
                                name="oralThrush"
                                value={
                                    getYesNoValue(values.oralThrushY, values.oralThrushN)
                                }
                                removeIsClearable={false}
                                dynamicOptions={YES_NO}
                                handleChange={(name, val) => handleYesNoRadio("oralThrush", val?.value)}
                            />

                            <ReactSelect
                                placeholderName={t("Lymph N >1 cm")}
                                searchable={true}
                                respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                id="lymph"
                                name="lymph"
                                value={
                                    getYesNoValue(values.lymphY, values.lymphN)
                                }
                                removeIsClearable={false}
                                dynamicOptions={YES_NO}
                                handleChange={(name, val) => handleYesNoRadio("lymph", val?.value)}
                            />

                            <ReactSelect
                                placeholderName={t("Finger clubbing")}
                                searchable={true}
                                respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                id="fingerClubbing"
                                name="fingerClubbing"
                                value={
                                    getYesNoValue(values.fingerClubbingY, values.fingerClubbingN)
                                }
                                removeIsClearable={false}
                                dynamicOptions={YES_NO}
                                handleChange={(name, val) => handleYesNoRadio("fingerClubbing", val?.value)}
                            />

                            <ReactSelect
                                placeholderName={t("Eye signs of malnutrition")}
                                searchable={true}
                                respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                id="eyeSigns"
                                name="eyeSigns"
                                value={
                                    PUS_ULCER.find(opt => {
                                        if (opt.value === "1" && values.eyeSignsPus === "1") return true;
                                        if (opt.value === "0" && values.eyeSignsulceration === "1") return true;
                                        return false;
                                    }) || null
                                }
                                removeIsClearable={false}
                                dynamicOptions={PUS_ULCER}
                                handleChange={(name, val) => {
                                    setValues(prev => ({
                                        ...prev,
                                        eyeSignsPus: val?.value === "1" ? "1" : "",
                                        eyeSignsulceration: val?.value === "0" ? "1" : "",
                                    }))
                                }}
                            />

                            <ReactSelect
                                placeholderName={t("Jaundice")}
                                searchable={true}
                                respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                id="jaundice"
                                name="jaundice"
                                value={
                                    getYesNoValue(values.jaundiceY, values.jaundiceN)
                                }
                                removeIsClearable={false}
                                dynamicOptions={YES_NO}
                                handleChange={(name, val) => handleYesNoRadio("jaundice", val?.value)}
                            />

                            <MultiSelectComp
                                placeholderName={t("Oedema (tick all)")}
                                value={NONEFOOT_KNEE_FACE.filter(opt => values[opt.code] === "1")}
                                dynamicOptions={NONEFOOT_KNEE_FACE}
                                handleChange={(name, selected) =>
                                    handleMultiSelectChange("Oedema", selected)
                                }
                                respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                isRemoveTemplate={true}
                            />
                        </div>

                        <Heading
                            title={t("A - Airway")}
                            isBreadcrumb={false}
                        />

                        <div className='row py-2'>
                            <ReactSelect
                                placeholderName={t("Stridor")}
                                searchable={true}
                                respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                id="stridor"
                                name="stridor"
                                value={
                                    getYesNoValue(values.stridorY, values.stridorN)
                                }
                                removeIsClearable={false}
                                dynamicOptions={YES_NO}
                                handleChange={(name, val) => handleYesNoRadio("stridor", val?.value)}
                            />
                        </div>

                        <Heading
                            title={t("B - Breathing")}
                            isBreadcrumb={false}
                        />

                        <div className='row py-2'>
                            <ReactSelect
                                placeholderName={t("Central Cyanosis")}
                                searchable={true}
                                respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                id="centralCyanosis"
                                name="centralCyanosis"
                                value={
                                    getYesNoValue(values.centralCyanosisY, values.centralCyanosisN)
                                }
                                removeIsClearable={false}
                                dynamicOptions={YES_NO}
                                handleChange={(name, val) => handleYesNoRadio("centralCyanosis", val?.value)}
                            />

                            <ReactSelect
                                placeholderName={t("Indrawing")}
                                searchable={true}
                                respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                id="intercostal"
                                name="intercostal"
                                value={
                                    getYesNoValue(values.intercostalY, values.intercostalN)
                                }
                                removeIsClearable={false}
                                dynamicOptions={YES_NO}
                                handleChange={(name, val) => handleYesNoRadio("intercostal", val?.value)}
                            />

                            <ReactSelect
                                placeholderName={t("Grunting")}
                                searchable={true}
                                respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                id="grunting"
                                name="grunting"
                                value={
                                    getYesNoValue(values.gruntingY, values.gruntingN)
                                }
                                removeIsClearable={false}
                                dynamicOptions={YES_NO}
                                handleChange={(name, val) => handleYesNoRadio("grunting", val?.value)}
                            />

                            <ReactSelect
                                placeholderName={t("Acidotic breathing")}
                                searchable={true}
                                respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                id="acidotic"
                                name="acidotic"
                                value={
                                    getYesNoValue(values.acidoticY, values.acidoticN)
                                }
                                removeIsClearable={false}
                                dynamicOptions={YES_NO}
                                handleChange={(name, val) => handleYesNoRadio("acidotic", val?.value)}
                            />

                            <ReactSelect
                                placeholderName={t("Wheeze")}
                                searchable={true}
                                respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                id="wheeze"
                                name="wheeze"
                                value={
                                    getYesNoValue(values.wheezeY, values.wheezeN)
                                }
                                removeIsClearable={false}
                                dynamicOptions={YES_NO}
                                handleChange={(name, val) => handleYesNoRadio("wheeze", val?.value)}
                            />

                            <ReactSelect
                                placeholderName={t("Crackles")}
                                searchable={true}
                                respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                id="crackles"
                                name="crackles"
                                value={
                                    getYesNoValue(values.cracklesY, values.cracklesN)
                                }
                                removeIsClearable={false}
                                dynamicOptions={YES_NO}
                                handleChange={(name, val) => handleYesNoRadio("crackles", val?.value)}
                            />
                        </div>

                        <Heading
                            title={t("Circ & Dehydration")}
                            isBreadcrumb={false}
                        />

                        <div className='row py-2'>
                            <ReactSelect
                                placeholderName={t("Peripheral pulse")}
                                searchable={true}
                                respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                id="pulse"
                                name="pulse"
                                value={
                                    NORMAL_WEAK.find(opt => {
                                        if (opt.value === "1" && values.pulseNormal === "1") return true;
                                        if (opt.value === "2" && values.pulseWeak === "1") return true;
                                        return false;
                                    }) || null
                                }
                                removeIsClearable={false}
                                dynamicOptions={NORMAL_WEAK}
                                handleChange={(name, val) => {
                                    setValues(prev => ({
                                        ...prev,
                                        pulseNormal: val?.value === "1" ? "1" : "",
                                        pulseWeak: val?.value === "2" ? "1" : ""
                                    }))
                                }}
                            />

                            <Input
                                className={"form-control"}
                                id="capRefillSecs"
                                type="text"
                                placeholder={""}
                                name={"capRefillSecs"}
                                lable={t("Cap Refill (secs)")}
                                value={values?.capRefillSecs || ""}
                                onChange={handleChange}
                                respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                            />
                            <ReactSelect
                                placeholderName={t("X=not possible")}
                                searchable={true}
                                respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                id="capRefillX"
                                name="capRefillX"
                                value={values?.capRefillX}
                                removeIsClearable={false}
                                dynamicOptions={YES_NO}
                                handleChange={handleReactSelectChange}
                            />

                            <ReactSelect
                                placeholderName={t("Circ / warm at")}
                                searchable={true}
                                respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                id="warm"
                                name="warm"
                                /* value={[
                                    { label: "Hand", value: "1" },
                                    { label: "Elbow", value: "2" },
                                    { label: "Shoulder", value: "3" }
                                ].find(opt => {
                                    if (opt.value === "1" && values.warmHand === "1") return true;
                                    if (opt.value === "2" && values.warmElbow === "1") return true;
                                    if (opt.value === "3" && values.warmShoulder === "1") return true;
                                    return false;
                                }) || null
                                } */

                                values={GETCIRCWARMAT(values?.warmHand, values?.warmElbow, values?.warmShoulder)}
                                removeIsClearable={false}
                                dynamicOptions={[
                                    { label: t("Hand"), value: "1" },
                                    { label: t("Elbow"), value: "2" },
                                    { label: t("Shoulder"), value: "3" }
                                ]}
                                handleChange={(name, val) => {
                                    setValues(prev => ({
                                        ...prev,
                                        warmHand: val?.value === "1" ? "1" : "",
                                        warmElbow: val?.value === "2" ? "1" : "",
                                        warmShoulder: val?.value === "3" ? "1" : ""
                                    }))
                                }}
                            />
                            {console.log(values?.warmHand)}

                            <ReactSelect
                                placeholderName={t("Pallor / Anaemia")}
                                searchable={true}
                                respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                id="pallor"
                                name="pallor"
                                value={[
                                    { label: "0", value: "0" },
                                    { label: "+", value: "1" },
                                    { label: "++", value: "2" }
                                ].find(opt => {
                                    if (opt.value === "0" && values.pallor0 === "1") return "1";
                                    if (opt.value === "1" && values.pallorPlus === "1") return "1";
                                    if (opt.value === "2" && values.pallorPlusPlus === "1") return "1";
                                    return false;
                                }) || null
                                }
                                removeIsClearable={false}
                                dynamicOptions={[
                                    { label: "0", value: "0" },
                                    { label: "+", value: "1" },
                                    { label: "++", value: "2" }
                                ]}
                                handleChange={(name, val) => {
                                    setValues(prev => ({
                                        ...prev,
                                        pallor0: val?.value === "0" ? "1" : "",
                                        pallorPlus: val?.value === "1" ? "1" : "",
                                        pallorPlusPlus: val?.value === "2" ? "1" : ""
                                    }))
                                }}
                            />

                            <ReactSelect
                                placeholderName={t("Sunken eyes")}
                                searchable={true}
                                respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                id="sunkenEyes"
                                name="sunkenEyes"
                                value={
                                    getYesNoValue(values.sunkenEyesY, values.sunkenEyesN)
                                }
                                removeIsClearable={false}
                                dynamicOptions={YES_NO}
                                handleChange={(name, val) => handleYesNoRadio("sunkenEyes", val?.value)}
                            />

                            <ReactSelect
                                placeholderName={t("Skin pinch (sec)")}
                                searchable={true}
                                respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                id="skinPinch"
                                name="skinPinch"
                                value={[
                                    { label: "0", value: "0" },
                                    { label: "1", value: "1" },
                                    { label: ">2", value: "2" }
                                ].find(opt => {
                                    if (opt.value === "0" && values.skinPinch0 === "1") return true;
                                    if (opt.value === "1" && values.skinPinch1 === "1") return true;
                                    if (opt.value === "2" && values.skinPinchGE2 === "1") return true;
                                    return false;
                                }) || null
                                }
                                removeIsClearable={false}
                                dynamicOptions={[
                                    { label: "0", value: "0" },
                                    { label: "1", value: "1" },
                                    { label: ">2", value: "2" }
                                ]}
                                handleChange={(name, val) => {
                                    setValues(prev => ({
                                        ...prev,
                                        skinPinch0: val?.value === "0" ? "1" : "",
                                        skinPinch1: val?.value === "1" ? "1" : "",
                                        skinPinchGE2: val?.value === "2" ? "1" : ""
                                    }))
                                }}
                            />
                        </div>

                        <Heading
                            title={t("D - Disability")}
                            isBreadcrumb={false}
                        />

                        <div className='row py-2'>
                            <ReactSelect
                                placeholderName={t("AVPU")}
                                searchable={true}
                                respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                id="avpu"
                                name="avpu"
                                value={[
                                    { label: "A", value: "A" },
                                    { label: "V", value: "V" },
                                    { label: "P", value: "P" },
                                    { label: "U", value: "U" }
                                ].find(opt => {
                                    if (opt.value === "A" && values.avpua === "1") return true;
                                    if (opt.value === "V" && values.avpuv === "1") return true;
                                    if (opt.value === "P" && values.avpup === "1") return true;
                                    if (opt.value === "U" && values.avpuu === "1") return true;
                                    return false;
                                }) || null
                                }
                                removeIsClearable={false}
                                dynamicOptions={[
                                    { label: "A", value: "A" },
                                    { label: "V", value: "V" },
                                    { label: "P", value: "P" },
                                    { label: "U", value: "U" }
                                ]}
                                handleChange={(name, val) => {
                                    setValues(prev => ({
                                        ...prev,
                                        avpua: val?.value === "A" ? "1" : "",
                                        avpuv: val?.value === "V" ? "1" : "",
                                        avpup: val?.value === "P" ? "1" : "",
                                        avpuu: val?.value === "U" ? "1" : ""
                                    }))
                                }}
                            />

                            <ReactSelect
                                placeholderName={t("Can drink /breastfeed ?")}
                                searchable={true}
                                respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                id="canDrink"
                                name="canDrink"
                                value={
                                    getYesNoValue(values.canDrinkY, values.canDrinkN)
                                }
                                removeIsClearable={false}
                                dynamicOptions={YES_NO}
                                handleChange={(name, val) => handleYesNoRadio("canDrink", val?.value)}
                            />

                            <ReactSelect
                                placeholderName={t("Stiff neck")}
                                searchable={true}
                                respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                id="stiffNeck"
                                name="stiffNeck"
                                value={getYesNoValue(values.stiffNeckY, values.stiffNeckN)}
                                removeIsClearable={false}
                                dynamicOptions={YES_NO}
                                handleChange={(name, val) => handleYesNoRadio("stiffNeck", val?.value)}
                            />

                            <ReactSelect
                                placeholderName={t("Bulging fontanelle")}
                                searchable={true}
                                respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                id="bulgingFont"
                                name="bulgingFont"
                                value={getYesNoValue(values.bulgingFontY, values.bulgingFontN)}
                                removeIsClearable={false}
                                dynamicOptions={YES_NO}
                                handleChange={(name, val) => handleYesNoRadio("bulgingFont", val?.value)}
                            />
                        </div>

                        <Heading
                            title={t("Infant <1yr")}
                            isBreadcrumb={false}
                        />

                        <div className='row py-2'>
                            <ReactSelect
                                placeholderName={t("Irritable")}
                                searchable={true}
                                respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                id="infantIrritable"
                                name="infantIrritable"
                                value={getYesNoValue(values.infantIrritableY, values.infantIrritableN)}
                                removeIsClearable={false}
                                dynamicOptions={YES_NO}
                                handleChange={(name, val) => handleYesNoRadio("infantIrritable", val?.value)}
                            />

                            <ReactSelect
                                placeholderName={t("Reduced movement /tone")}
                                searchable={true}
                                respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                id="reducedMovement"
                                name="reducedMovement"
                                value={getYesNoValue(values.reducedMovementY, values.reducedMovementN)}
                                removeIsClearable={false}
                                dynamicOptions={YES_NO}
                                handleChange={(name, val) => handleYesNoRadio("reducedMovement", val?.value)}
                            />

                            <ReactSelect
                                placeholderName={t("Umbilicus")}
                                searchable={true}
                                respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                id="umbilicus"
                                name="umbilicus"
                                value={[
                                    { label: "Normal", value: "normal" },
                                    { label: "Pus", value: "pus" },
                                    { label: "Pus & red", value: "pus_red" }
                                ].find(opt => {
                                    if (opt.value === "normal" && values.umbNormal === "1") return true;
                                    if (opt.value === "pus" && values.umbPus === "1") return true;
                                    if (opt.value === "pus_red" && values.umbPusRed === "1") return true;
                                    return false;
                                }) || null
                                }
                                removeIsClearable={false}
                                dynamicOptions={[
                                    { label: t("Normal"), value: "normal" },
                                    { label: t("Pus"), value: "pus" },
                                    { label: t("Pus & red"), value: "pus_red" }
                                ]}
                                handleChange={(name, val) => {
                                    setValues(prev => ({
                                        ...prev,
                                        umbNormal: val?.value === "normal" ? "1" : "",
                                        umbPus: val?.value === "pus" ? "1" : "",
                                        umbPusRed: val?.value === "pus_red" ? "1" : ""
                                    }))
                                }}
                            />

                            <div className="col-xl-4 col-md-4 col-sm-4 col-12">
                                <TextAreaInput
                                    className="form-control"
                                    lable={t("CVS")}
                                    placeholder={""}
                                    name="cvs"
                                    id="cvs"
                                    rows={4}
                                    value={values?.cvs || ""}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className='col-12'>
                                <div className="col-xl-6 col-md-6 col-sm-6 col-12 m-auto border rounded p-4">
                                    <div className='card'>
                                        <img
                                            src={abdomanChestImage}
                                            alt="abdomanChestImage"
                                            className="img-fluid w-100 m-auto"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Heading
                            title={t("Bones & Joints")}
                            isBreadcrumb={false}
                        />

                        <div className='row py-2'>
                            <ReactSelect
                                placeholderName={t("Wrist / Rib signs Rickets")}
                                searchable={true}
                                respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                id="rickets"
                                name="rickets"
                                value={getYesNoValue(values.ricketsY, values.ricketsN)}
                                removeIsClearable={false}
                                dynamicOptions={YES_NO}
                                handleChange={(name, val) => handleYesNoRadio("rickets", val?.value)}
                            />
                        </div>

                        <Heading
                            title={t("ENT Exam")}
                            isBreadcrumb={false}
                        />

                        <div className='row py-2'>
                            <Input
                                className={"form-control"}
                                lable={t("Rt Ear")}
                                type="text"
                                placeholder={""}
                                name={"rEar"}
                                value={values?.rEar || ""}
                                onChange={handleChange}
                                respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                            />

                            <Input
                                className={"form-control"}
                                type="text"
                                placeholder={""}
                                name={"lEar"}
                                lable={t("Lt Ear")}
                                value={values?.lEar || ""}
                                onChange={handleChange}
                                respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                            />

                            <Input
                                className={"form-control"}
                                type="text"
                                placeholder={""}
                                name={"nose"}
                                lable={t("Nose")}
                                value={values?.nose || ""}
                                onChange={handleChange}
                                respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                            />

                            <Input
                                className={"form-control"}
                                type="text"
                                placeholder={""}
                                name={"throat"}
                                lable={t("Throat")}
                                value={values?.throat || ""}
                                onChange={handleChange}
                                respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                            />
                        </div>

                        <Heading
                            title={t("Neurological Exam")}
                            isBreadcrumb={false}
                        />

                        <div className='row py-2'>
                            <div className="col-12">
                                <table className="table table-bordered">
                                    <thead className="table-light">
                                        <tr>
                                            <th rowSpan={2}></th>
                                            <th colSpan={2} className="text-center card-header card_background">{t("Right Side")}</th>
                                            <th colSpan={2} className="text-center card-header card_background">{t("Left Side")}</th>
                                        </tr>
                                        <tr>
                                            <th className="text-center">{t("Upper Limb")}</th>
                                            <th className="text-center">{t("Lower Limb")}</th>
                                            <th className="text-center">{t("Upper Limb")}</th>
                                            <th className="text-center">{t("Lower Limb")}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {tBody1.map((row, index) => (
                                            <tr key={index}>
                                                <td><strong>{row.label}</strong></td>
                                                <td>{row.rightUpper}</td>
                                                <td>{row.rightLower}</td>
                                                <td>{row.leftUpper}</td>
                                                <td>{row.leftLower}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <Heading
                            title={t("Summary of Presentation & Problems")}
                            isBreadcrumb={false}
                        />

                        <div className='row py-2'>
                            <div className="col-xl-6 col-md-6 col-sm-6 col-12">
                                <TextAreaInput
                                    className="form-control"
                                    lable={t("Summary of Presentation & Problems")}
                                    placeholder={""}
                                    name="summary"
                                    id="summary"
                                    rows={4}
                                    value={values?.summary || ""}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <Heading
                            title={t("Investigations Ordered (record subsequent tests and all results in medical record)")}
                            isBreadcrumb={false}
                        />

                        <div className='row py-2'>
                            <MultiSelectComp
                                placeholderName={t("Select Malaria Tests")}
                                value={MALERIA.filter(opt => values[opt.code] === "1")}
                                dynamicOptions={MALERIA}
                                handleChange={(name, selected) =>
                                    handleMultiSelectChange("MALERIA", selected)
                                }
                                respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                isRemoveTemplate={true}
                            />

                            <MultiSelectComp
                                placeholderName={t("Select Glucose Tests")}
                                value={GLUCOSE.filter(opt => values[opt.code] === "1")}
                                dynamicOptions={GLUCOSE}
                                handleChange={(name, selected) =>
                                    handleMultiSelectChange("GLUCOSE", selected)
                                }
                                respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                isRemoveTemplate={true}
                            />

                            <MultiSelectComp
                                placeholderName={t("Select Haematology Tests")}
                                value={HAEMATOLOGY.filter(opt => values[opt.code] === "1")}
                                dynamicOptions={HAEMATOLOGY}
                                handleChange={(name, selected) =>
                                    handleMultiSelectChange("HAEMATOLOGY", selected)
                                }
                                respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                isRemoveTemplate={true}
                            />

                            <MultiSelectComp
                                placeholderName={t("Select Chemistry Tests")}
                                value={CHEMISTRY.filter(opt => values[opt.code] === "1")}
                                dynamicOptions={CHEMISTRY}
                                handleChange={(name, selected) =>
                                    handleMultiSelectChange("CHEMISTRY", selected)
                                }
                                respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                isRemoveTemplate={true}
                            />

                            <MultiSelectComp
                                placeholderName={t("Select Microbiology Tests")}
                                value={MICROBIOLOGY.filter(opt => values[opt.code] === "1")}
                                dynamicOptions={MICROBIOLOGY}
                                handleChange={(name, selected) =>
                                    handleMultiSelectChange("MICROBIOLOGY", selected)
                                }
                                respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                isRemoveTemplate={true}
                            />

                            <MultiSelectComp
                                placeholderName={t("Select X-Ray Tests")}
                                value={XRAY.filter(opt => values[opt.code] === "1")}
                                dynamicOptions={XRAY}
                                handleChange={(name, selected) =>
                                    handleMultiSelectChange("XRAY", selected)
                                }
                                respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                isRemoveTemplate={true}
                            />

                            <MultiSelectComp
                                placeholderName={t("Select HIV Tests")}
                                value={HIV.filter(opt => values[opt.code] === "1")}
                                dynamicOptions={HIV}
                                handleChange={(name, selected) =>
                                    handleMultiSelectChange("HIV", selected)
                                }
                                respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                isRemoveTemplate={true}
                            />

                            <MultiSelectComp
                                placeholderName={t("Urine")}
                                value={URINE.filter(opt => values[opt.code] === "1")}
                                dynamicOptions={URINE}
                                handleChange={(name, selected) =>
                                    handleMultiSelectChange("URINE", selected)
                                }
                                respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                isRemoveTemplate={true}
                            />

                            <Input
                                className={"form-control"}
                                type="text"
                                placeholder={""}
                                name={"xrayWristOther"}
                                lable={t("Wrist Other")}
                                value={values?.xrayWristOther || ""}
                                onChange={handleChange}
                                respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                            />

                            <MultiSelectComp
                                placeholderName={t("TB test")}
                                value={TEST_TB.filter(opt => values[opt.code] === "1")}
                                dynamicOptions={TEST_TB}
                                handleChange={(name, selected) =>
                                    handleMultiSelectChange("TEST_TB", selected)
                                }
                                respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                isRemoveTemplate={true}
                            />

                            <MultiSelectComp
                                placeholderName={t("Stool")}
                                value={STOOL.filter(opt => values[opt.code] === "1")}
                                dynamicOptions={STOOL}
                                handleChange={(name, selected) =>
                                    handleMultiSelectChange("STOOL", selected)
                                }
                                respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                isRemoveTemplate={true}
                            />

                            <Input
                                className={"form-control"}
                                type="text"
                                placeholder={""}
                                name={"otherinvestigation"}
                                lable={t("Other")}
                                value={values?.otherinvestigation || ""}
                                onChange={handleChange}
                                respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                            />
                        </div>

                        <Heading
                            title={t("Admission Diagnoses – Select ONE primary diagnosis (tick box indicating {1}) and ANY secondary diagnoses (tick box indicating {2}), then indicate level of severity or type of disease if required")}
                            isBreadcrumb={false}
                        />

                        <div className='row py-2'>
                            <div className='col-12'>
                                <div className="col-12">
                                    <Tables thead={THEADAdmissionDiagnoses} tbody={tBodyAdmissionDiagnoses} />
                                </div>
                            </div>
                        </div>

                        <Heading
                            title={t("Clinician Details")}
                            isBreadcrumb={false}
                        />

                        <div className='row py-2'>
                            <Input
                                className={"form-control"}
                                type="text"
                                placeholder={""}
                                name={"clinicianName"}
                                lable={t("Clinician Name & Sign")}
                                value={values?.clinicianName || ""}
                                onChange={handleChange}
                                respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                            />
                            <DatePicker
                                className="custom-calendar"
                                placeholder={VITE_DATE_FORMAT}
                                lable={t("Date")}
                                respclass={"col-xl-2 col-md-3 col-sm-4 col-12"}
                                name="date"
                                id="date"
                                value={values?.date}
                                showTime
                                hourFormat="12"
                                handleChange={handlDateTimeChange}
                            />

                            <TimePicker
                                placeholderName={t("Time")}
                                lable={t("Time")}
                                name={"time"}
                                value={values?.time || ""}
                                respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                handleChange={handlDateTimeChange}
                            />
                            <div className="text-right mt-1">
                                <button className="btn btn-sm btn-success ml-2" type="button" onClick={handleSave}>
                                    {values?.id ? t("Update") : t("save")}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </form>

            <div className="patient_registration card my-1">
                <Heading
                    title={t("Particular's List")}
                    isBreadcrumb={false}
                />
                <div className="row">
                    <div className="col-12">
                        {tabelData && tabelData.length > 0 ? (
                            <Tables
                                thead={ApiTHEAD}
                                tbody={tabelData.map((val, index) => ({
                                    "S.No": index + 1,
                                    Weight: val?.Weight,
                                    HeightLength: val?.HeightLength,
                                    CreatedBy: val?.EmployeeName,
                                    Action: (
                                        <i className="fa fa-edit p-1" onClick={() => handleEditPaediatricAdmissionRecord(val?.Id)} />
                                    ),
                                }))}
                            />
                        ) : (
                            <div className="text-center text-muted py-3">{t("No Data Found")}</div>
                        )}

                    </div>
                </div>
            </div>
        </>
    )
}

export default PaediatricAdmissionRecord