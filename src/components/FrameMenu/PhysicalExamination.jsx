import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next';
import Heading from '../UI/Heading';
import DatePicker from '../formComponent/DatePicker';
import TimePicker from '../formComponent/TimePicker';
import { getPhysicalExamListApi, saveOrUpdatePhysicalExamApi } from '../../networkServices/Emergency';
import { notify } from '../../utils/ustil2';
import Input from '../formComponent/Input';
import Tables from '../UI/customTable';

const PhysicalExamination = ({ data }) => {
    const [t] = useTranslation();
    const { patientID, transactionID } = data;
    const [values, setValues] = useState({
        Date: new Date(),
        Time: new Date(),
        id: 0,
        generalCondition: "",
        hygiene: "",
        nutritional: "",
        behaviour: "",
        oedema: "",
        other1: "",
        hair: "",
        face: "",
        eyes: "",
        nose: "",
        mouth: "",
        others2: "",
        gcScore: "",
        vision: "",
        hearing: "",
        speech: "",
        cry: "",
        others3: "",
        pulseRate: "",
        bloodPressure: "",
        apexBeat: "",
        others4: "",
        respiration: "",
        rate: "",
        sputum: "",
        others5: "",
        organomegally: "",
        scar: "",
        tenderness: "",
        bowelPattern: "",
        lastBowelAction: "",
        laxativesInUse: "",
        bowelSound: "",
        others6: "",
        mobility: "",
        gait: "",
        limbs: "",
        digits: "",
        muscleTone: "",
        others7: "",
        bladder: "",
        voidingPattern: "",
        pain: "",
        discharge: "",
        kidneysPalpable: "",
        kidneysTender: "",
        colour: "",
        bruises: "",
        rashes: "",
        temperature: "",
        scars: "",
        waterLowScore: "",
        woundsBurns: "",
        others9: "",
        physicalCompletedBy: "",
        designation: "",
        cough: "",
        patientID: "",
        transactionID: ""
    });
    const { VITE_DATE_FORMAT } = import.meta.env;
    const [tableData, setTableData] = useState([])
    const THEAD = [
        { name: t("S.No"), width: "10%" },
        { name: t("entryDate"), width: "10%" },
        { name: t("entryBy"), width: "10%" },
        { name: t("Action"), width: "10%" },

    ]
    const handleChange = (e) => {
        const { name, value } = e.target;
        setValues((val) => ({ ...val, [name]: value }));
    };

    const fetchList = async () => {
        const res = await getPhysicalExamListApi(transactionID);
        if (res?.success) {
            setTableData(res?.data)
        } else {
            setTableData([])
            notify(res?.message, "error")
        }
    }
    useEffect(() => {
        fetchList()
    }, [])
    const handleSave = async () => {
        const payload = {
            id: values.id || 0,
            // date: values?.Date ? moment(values?.Date).format("DD-MM-YYYY") : new Date(),
            // time: values?.Time ? moment(values?.Time).format("hh:mm A") : new Date(),
            generalCondition: values.generalCondition || "",
            hygiene: values.hygiene || "",
            nutritional: values.nutritional || "",
            behaviour: values.behaviour || "",
            oedema: values.oedema || "",
            other1: values.other1 || "",
            hair: values.hair || "",
            face: values.face || "",
            eyes: values.eyes || "",
            nose: values.nose || "",
            mouth: values.mouth || "",
            others2: values.others2 || "",
            gcScore: values.gcScore || "",
            vision: values.vision || "",
            hearing: values.hearing || "",
            speech: values.speech || "",
            cry: values.cry || "",
            others3: values.others3 || "",
            pulseRate: values.pulseRate || "",
            bloodPressure: values.bloodPressure || "",
            apexBeat: values.apexBeat || "",
            others4: values.others4 || "",
            respiration: values.respiration || "",
            rate: values.rate || "",
            sputum: values.sputum || "",
            others5: values.others5 || "",
            organomegally: values.organomegally || "",
            scar: values.scar || "",
            tenderness: values.tenderness || "",
            bowelPattern: values.bowelPattern || "",
            lastBowelAction: values.lastBowelAction || "",
            laxativesInUse: values.laxativesInUse || "",
            bowelSound: values.bowelSound || "",
            others6: values.others6 || "",
            mobility: values.mobility || "",
            gait: values.gait || "",
            limbs: values.limbs || "",
            digits: values.digits || "",
            muscleTone: values.muscleTone || "",
            others7: values.others7 || "",
            bladder: values.bladder || "",
            voidingPattern: values.voidingPattern || "",
            pain: values.pain || "",
            discharge: values.discharge || "",
            kidneysPalpable: values.kidneysPalpable || "",
            kidneysTender: values.kidneysTender || "",
            colour: values.colour || "",
            bruises: values.bruises || "",
            rashes: values.rashes || "",
            temperature: values.temperature || "",
            scars: values.scars || "",
            waterLowScore: values.waterLowScore || "",
            woundsBurns: values.woundsBurns || "",
            others9: values.others9 || "",
            physicalCompletedBy: values.physicalCompletedBy || "",
            designation: values.designation || "",
            cough: values.cough || "",
            patientID: patientID || "",
            transactionID: transactionID || ""
        }
        console.log(payload);
        const res = await saveOrUpdatePhysicalExamApi(payload)
        if (res?.success) {
            fetchList()
            notify(res?.message, "success")
        } else {
            notify(res?.message, "error")

        }
    }
    const handleEdit = (row) => {
        const timeFormateDate = (time) => {
            if (typeof time === "string") {
                const date = new Date();
                if (time) {
                    const [hours, minutes, period] = time?.match(/(\d+):(\d+)\s*(AM|PM)/i)?.slice(1);
                    date.setHours(
                        period === "PM" && hours !== "12"
                            ? +hours + 12
                            : hours === "12" && period === "AM"
                                ? 0
                                : +hours
                    );
                    date.setMinutes(+minutes);
                }
                return date;
            };
        }
        setValues(prev => ({
            ...prev,
            ...row,
            Date: new Date(row?.entryDate1),
            Time: row?.time1 ?timeFormateDate(row?.time1):new Date(), 
        }))
    }



    return (
        <div className='mt-2 spatient_registration_card'>
            <div className="patient_registration card">
                <Heading
                    title={t("Physical Examination")}
                    isBreadcrumb={false}
                    secondTitle={
                        <div className=' flex'>
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
                            // onClick={handlePrint}
                            >
                                {t("Print")}
                            </button> */}
                        </div>
                    }
                />
                <div className='row p-2'>
                    <div className="col-xl-2 col-md-4 col-sm-6 col-12 d-flex">

                        <DatePicker
                            className={`custom-calendar `}
                            respclass="vital-sign-date mr-1"
                            id="Date"
                            name="Date"
                            inputClassName={"required-fields"}
                            value={values?.Date ? values?.Date : new Date()}
                            handleChange={handleChange}
                            lable={t("Date")}
                            placeholder={VITE_DATE_FORMAT}
                        />
                        <TimePicker
                            placeholderName={t("Time")}
                            lable={t("Time")}
                            id="Time"
                            respclass="vital-sign-date"
                            name="Time"
                            value={values?.Time ? values?.Time : new Date()}

                            handleChange={handleChange}
                        />

                    </div>
                    <div className="col-12 col-md-12 col-lg-10">
                        <div
                            className="pt-3 pb-2 pr-2 pl-2 form-group"
                            style={{
                                border: "1px solid #ced4da",
                                borderRadius: "4px",
                                position: "relative",
                            }}
                        >
                            <label className="label" style={{ position: "absolute" }}>
                                {t("OVERALL APPEARANCE ON ADMISSION")}
                            </label>
                            <div className="row">
                                <Input
                                    type="text"
                                    className="form-control"
                                    id="generalCondition"
                                    name="generalCondition"
                                    value={values?.generalCondition}
                                    onChange={handleChange}
                                    lable={t("General Condition")}
                                    respclass="col-sm-6  col-md-2 col-12"
                                    placeholder=""
                                />
                                <Input
                                    type="text"
                                    className="form-control"
                                    id="hygiene"
                                    name="hygiene"
                                    value={values?.hygiene}
                                    onChange={handleChange}
                                    lable={t("hygiene")}
                                    respclass="col-sm-6  col-md-2 col-12"
                                    placeholder=""
                                />
                                <Input
                                    type="text"
                                    className="form-control"
                                    id="nutritional"
                                    name="nutritional"
                                    value={values?.nutritional}
                                    onChange={handleChange}
                                    lable={t("nutritional")}
                                    respclass="col-sm-6  col-md-2 col-12"
                                    placeholder=""
                                />
                                <Input
                                    type="text"
                                    className="form-control"
                                    id="behaviour"
                                    name="behaviour"
                                    value={values?.behaviour}
                                    onChange={handleChange}
                                    lable={t("behaviour")}
                                    respclass="col-sm-6  col-md-2 col-12"
                                    placeholder=""
                                />
                                <Input
                                    type="text"
                                    className="form-control"
                                    id="oedema"
                                    name="oedema"
                                    value={values?.oedema}
                                    onChange={handleChange}
                                    lable={t("oedema")}
                                    respclass="col-sm-6  col-md-2 col-12"
                                    placeholder=""
                                />
                                <Input
                                    type="text"
                                    className="form-control"
                                    id="other1"
                                    name="other1"
                                    value={values?.other1}
                                    onChange={handleChange}
                                    lable={t("other1")}
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
                                {t("HEAD AND NECK")}
                            </label>
                            <div className="row">
                                <Input
                                    type="text"
                                    className="form-control"
                                    id="hair"
                                    name="hair"
                                    value={values?.hair}
                                    onChange={handleChange}
                                    lable={t("hair")}
                                    respclass="col-sm-6  col-md-2 col-12"
                                    placeholder=""
                                />
                                <Input
                                    type="text"
                                    className="form-control"
                                    id="face"
                                    name="face"
                                    value={values?.face}
                                    onChange={handleChange}
                                    lable={t("face")}
                                    respclass="col-sm-6  col-md-2 col-12"
                                    placeholder=""
                                />
                                <Input
                                    type="text"
                                    className="form-control"
                                    id="eyes"
                                    name="eyes"
                                    value={values?.eyes}
                                    onChange={handleChange}
                                    lable={t("eyes")}
                                    respclass="col-sm-6  col-md-2 col-12"
                                    placeholder=""
                                />
                                <Input
                                    type="text"
                                    className="form-control"
                                    id="nose"
                                    name="nose"
                                    value={values?.nose}
                                    onChange={handleChange}
                                    lable={t("nose")}
                                    respclass="col-sm-6  col-md-2 col-12"
                                    placeholder=""
                                />
                                <Input
                                    type="text"
                                    className="form-control"
                                    id="mouth"
                                    name="mouth"
                                    value={values?.mouth}
                                    onChange={handleChange}
                                    lable={t("mouth")}
                                    respclass="col-sm-6  col-md-2 col-12"
                                    placeholder=""
                                />
                                <Input
                                    type="text"
                                    className="form-control"
                                    id="others2"
                                    name="others2"
                                    value={values?.others2}
                                    onChange={handleChange}
                                    lable={t("others2")}
                                    respclass="col-sm-6  col-md-2 col-12"
                                    placeholder=""
                                />
                            </div>
                        </div>
                    </div>
                    <div className="col-12 col-sm-6">
                        <div
                            className="pt-3 pb-2 pr-2 pl-2 form-group"
                            style={{
                                border: "1px solid #ced4da",
                                borderRadius: "4px",
                                position: "relative",
                            }}
                        >
                            <label className="label" style={{ position: "absolute" }}>
                                {t("CENTRAL NERVOUS SYSTEM(WHERE APPLICABLE)")}
                            </label>
                            <div className="row">
                                <Input
                                    type="text"
                                    className="form-control"
                                    id="gcScore"
                                    name="gcScore"
                                    value={values?.gcScore}
                                    onChange={handleChange}
                                    lable={t("gcScore")}
                                    respclass="col-sm-6  col-md-4 col-12"
                                    placeholder=""
                                />
                                <Input
                                    type="text"
                                    className="form-control"
                                    id="vision"
                                    name="vision"
                                    value={values?.vision}
                                    onChange={handleChange}
                                    lable={t("vision")}
                                    respclass="col-sm-6  col-md-4 col-12"
                                    placeholder=""
                                />
                                <Input
                                    type="text"
                                    className="form-control"
                                    id="hearing"
                                    name="hearing"
                                    value={values?.hearing}
                                    onChange={handleChange}
                                    lable={t("hearing")}
                                    respclass="col-sm-6  col-md-4 col-12"
                                    placeholder=""
                                />
                                <Input
                                    type="text"
                                    className="form-control"
                                    id="speech"
                                    name="speech"
                                    value={values?.speech}
                                    onChange={handleChange}
                                    lable={t("speech")}
                                    respclass="col-sm-6  col-md-4 col-12"
                                    placeholder=""
                                />
                                <Input
                                    type="text"
                                    className="form-control"
                                    id="cry"
                                    name="cry"
                                    value={values?.cry}
                                    onChange={handleChange}
                                    lable={t("cry")}
                                    respclass="col-sm-6  col-md-4 col-12"
                                    placeholder=""
                                />
                                <Input
                                    type="text"
                                    className="form-control"
                                    id="others3"
                                    name="others3"
                                    value={values?.others3}
                                    onChange={handleChange}
                                    lable={t("others3")}
                                    respclass="col-sm-6  col-md-4 col-12"
                                    placeholder=""
                                />
                            </div>
                        </div>
                    </div>
                    <div className="col-12 col-sm-6">
                        <div
                            className="pt-3 pb-2 pr-2 pl-2 form-group"
                            style={{
                                border: "1px solid #ced4da",
                                borderRadius: "4px",
                                position: "relative",
                            }}
                        >
                            <label className="label" style={{ position: "absolute" }}>
                                {t("CARDIOVASCULAR")}
                            </label>
                            <div className="row">
                                <Input
                                    type="text"
                                    className="form-control"
                                    id="pulseRate"
                                    name="pulseRate"
                                    value={values?.pulseRate}
                                    onChange={handleChange}
                                    lable={t("pulseRate")}
                                    respclass="col-sm-6  col-md-4 col-12"
                                    placeholder=""
                                />
                                <Input
                                    type="text"
                                    className="form-control"
                                    id="bloodPressure"
                                    name="bloodPressure"
                                    value={values?.bloodPressure}
                                    onChange={handleChange}
                                    lable={t("bloodPressure")}
                                    respclass="col-sm-6  col-md-4 col-12"
                                    placeholder=""
                                />
                                <Input
                                    type="text"
                                    className="form-control"
                                    id="apexBeat"
                                    name="apexBeat"
                                    value={values?.apexBeat}
                                    onChange={handleChange}
                                    lable={t("apexBeat")}
                                    respclass="col-sm-6  col-md-4 col-12"
                                    placeholder=""
                                />

                                <Input
                                    type="text"
                                    className="form-control"
                                    id="others4"
                                    name="others4"
                                    value={values?.others4}
                                    onChange={handleChange}
                                    lable={t("others4")}
                                    respclass="col-sm-6  col-md-4 col-12"
                                    placeholder=""
                                />
                            </div>
                        </div>
                    </div>
                    <div className="col-12 col-sm-6">
                        <div
                            className="pt-3 pb-2 pr-2 pl-2 form-group"
                            style={{
                                border: "1px solid #ced4da",
                                borderRadius: "4px",
                                position: "relative",
                            }}
                        >
                            <label className="label" style={{ position: "absolute" }}>
                                {t("RESPIRATORY SYSTEM")}
                            </label>
                            <div className="row">
                                <Input
                                    type="text"
                                    className="form-control"
                                    id="respiration"
                                    name="respiration"
                                    value={values?.respiration}
                                    onChange={handleChange}
                                    lable={t("respiration")}
                                    respclass="col-sm-6  col-md-4 col-12"
                                    placeholder=""
                                />
                                <Input
                                    type="text"
                                    className="form-control"
                                    id="rate"
                                    name="rate"
                                    value={values?.rate}
                                    onChange={handleChange}
                                    lable={t("rate")}
                                    respclass="col-sm-6  col-md-4 col-12"
                                    placeholder=""
                                />
                                <Input
                                    type="text"
                                    className="form-control"
                                    id="cough"
                                    name="cough"
                                    value={values?.cough}
                                    onChange={handleChange}
                                    lable={t("cough")}
                                    respclass="col-sm-6  col-md-4 col-12"
                                    placeholder=""
                                />

                                <Input
                                    type="text"
                                    className="form-control"
                                    id="sputum"
                                    name="sputum"
                                    value={values?.sputum}
                                    onChange={handleChange}
                                    lable={t("sputum")}
                                    respclass="col-sm-6  col-md-4 col-12"
                                    placeholder=""
                                />
                                <Input
                                    type="text"
                                    className="form-control"
                                    id="others5"
                                    name="others5"
                                    value={values?.others5}
                                    onChange={handleChange}
                                    lable={t("others5")}
                                    respclass="col-sm-6  col-md-4 col-12"
                                    placeholder=""
                                />
                            </div>
                        </div>
                    </div>
                    <div className="col-12 col-sm-6">
                        <div
                            className="pt-3 pb-2 pr-2 pl-2 form-group"
                            style={{
                                border: "1px solid #ced4da",
                                borderRadius: "4px",
                                position: "relative",
                            }}
                        >
                            <label className="label" style={{ position: "absolute" }}>
                                {t("GASTROINTESTINAL")}
                            </label>
                            <div className="row">
                                <Input
                                    type="text"
                                    className="form-control"
                                    id="organomegally"
                                    name="organomegally"
                                    value={values?.organomegally}
                                    onChange={handleChange}
                                    lable={t("organomegally")}
                                    respclass="col-sm-6  col-md-4 col-12"
                                    placeholder=""
                                />
                                <Input
                                    type="text"
                                    className="form-control"
                                    id="scar"
                                    name="scar"
                                    value={values?.scar}
                                    onChange={handleChange}
                                    lable={t("scar")}
                                    respclass="col-sm-6  col-md-4 col-12"
                                    placeholder=""
                                />
                                <Input
                                    type="text"
                                    className="form-control"
                                    id="tenderness"
                                    name="tenderness"
                                    value={values?.tenderness}
                                    onChange={handleChange}
                                    lable={t("tenderness")}
                                    respclass="col-sm-6  col-md-4 col-12"
                                    placeholder=""
                                />

                                <Input
                                    type="text"
                                    className="form-control"
                                    id="bowelPattern"
                                    name="bowelPattern"
                                    value={values?.bowelPattern}
                                    onChange={handleChange}
                                    lable={t("bowelPattern")}
                                    respclass="col-sm-6  col-md-4 col-12"
                                    placeholder=""
                                />
                                <Input
                                    type="text"
                                    className="form-control"
                                    id="lastBowelAction"
                                    name="lastBowelAction"
                                    value={values?.lastBowelAction}
                                    onChange={handleChange}
                                    lable={t("lastBowelAction")}
                                    respclass="col-sm-6  col-md-4 col-12"
                                    placeholder=""
                                />
                                <Input
                                    type="text"
                                    className="form-control"
                                    id="laxativesInUse"
                                    name="laxativesInUse"
                                    value={values?.laxativesInUse}
                                    onChange={handleChange}
                                    lable={t("laxatives In Use")}
                                    respclass="col-sm-6  col-md-4 col-12"
                                    placeholder=""
                                />
                                <Input
                                    type="text"
                                    className="form-control"
                                    id="bowelSound"
                                    name="bowelSound"
                                    value={values?.bowelSound}
                                    onChange={handleChange}
                                    lable={t("bowel Sound")}
                                    respclass="col-sm-6  col-md-4 col-12"
                                    placeholder=""
                                />
                                <Input
                                    type="text"
                                    className="form-control"
                                    id="others6"
                                    name="others6"
                                    value={values?.others6}
                                    onChange={handleChange}
                                    lable={t("others6")}
                                    respclass="col-sm-6  col-md-4 col-12"
                                    placeholder=""
                                />
                            </div>
                        </div>
                    </div>
                    <div className="col-12 col-sm-6">
                        <div
                            className="pt-3 pb-2 pr-2 pl-2 form-group"
                            style={{
                                border: "1px solid #ced4da",
                                borderRadius: "4px",
                                position: "relative",
                            }}
                        >
                            <label className="label" style={{ position: "absolute" }}>
                                {t("MUSCULO-SKELETAL")}
                            </label>
                            <div className="row">
                                <Input
                                    type="text"
                                    className="form-control"
                                    id="mobility"
                                    name="mobility"
                                    value={values?.mobility}
                                    onChange={handleChange}
                                    lable={t("mobility")}
                                    respclass="col-sm-6  col-md-4 col-12"
                                    placeholder=""
                                />
                                <Input
                                    type="text"
                                    className="form-control"
                                    id="gait"
                                    name="gait"
                                    value={values?.gait}
                                    onChange={handleChange}
                                    lable={t("gait")}
                                    respclass="col-sm-6  col-md-4 col-12"
                                    placeholder=""
                                />
                                <Input
                                    type="text"
                                    className="form-control"
                                    id="limbs"
                                    name="limbs"
                                    value={values?.limbs}
                                    onChange={handleChange}
                                    lable={t("limbs")}
                                    respclass="col-sm-6  col-md-4 col-12"
                                    placeholder=""
                                />

                                <Input
                                    type="text"
                                    className="form-control"
                                    id="digits"
                                    name="digits"
                                    value={values?.digits}
                                    onChange={handleChange}
                                    lable={t("digits")}
                                    respclass="col-sm-6  col-md-4 col-12"
                                    placeholder=""
                                />
                                <Input
                                    type="text"
                                    className="form-control"
                                    id="muscleTone"
                                    name="muscleTone"
                                    value={values?.muscleTone}
                                    onChange={handleChange}
                                    lable={t("muscleTone")}
                                    respclass="col-sm-6  col-md-4 col-12"
                                    placeholder=""
                                />
                                <Input
                                    type="text"
                                    className="form-control"
                                    id="others7"
                                    name="others7"
                                    value={values?.others7}
                                    onChange={handleChange}
                                    lable={t("others7")}
                                    respclass="col-sm-6  col-md-4 col-12"
                                    placeholder=""
                                />
                            </div>
                        </div>
                    </div>
                    <div className="col-12 col-sm-6">
                        <div
                            className="pt-3 pb-2 pr-2 pl-2 form-group"
                            style={{
                                border: "1px solid #ced4da",
                                borderRadius: "4px",
                                position: "relative",
                            }}
                        >
                            <label className="label" style={{ position: "absolute" }}>
                                {t("URINOGENITAL")}
                            </label>
                            <div className="row">
                                <Input
                                    type="text"
                                    className="form-control"
                                    id="bladder"
                                    name="bladder"
                                    value={values?.bladder}
                                    onChange={handleChange}
                                    lable={t("bladder")}
                                    respclass="col-sm-6  col-md-4 col-12"
                                    placeholder=""
                                />
                                <Input
                                    type="text"
                                    className="form-control"
                                    id="voidingPattern"
                                    name="voidingPattern"
                                    value={values?.voidingPattern}
                                    onChange={handleChange}
                                    lable={t("voidingPattern")}
                                    respclass="col-sm-6  col-md-4 col-12"
                                    placeholder=""
                                />
                                <Input
                                    type="text"
                                    className="form-control"
                                    id="pain"
                                    name="pain"
                                    value={values?.pain}
                                    onChange={handleChange}
                                    lable={t("pain")}
                                    respclass="col-sm-6  col-md-4 col-12"
                                    placeholder=""
                                />

                                <Input
                                    type="text"
                                    className="form-control"
                                    id="discharge"
                                    name="discharge"
                                    value={values?.discharge}
                                    onChange={handleChange}
                                    lable={t("discharge")}
                                    respclass="col-sm-6  col-md-4 col-12"
                                    placeholder=""
                                />
                                <Input
                                    type="text"
                                    className="form-control"
                                    id="kidneysPalpable"
                                    name="kidneysPalpable"
                                    value={values?.kidneysPalpable}
                                    onChange={handleChange}
                                    lable={t("kidneysPalpable")}
                                    respclass="col-sm-6  col-md-4 col-12"
                                    placeholder=""
                                />
                                <Input
                                    type="text"
                                    className="form-control"
                                    id="kidneysTender"
                                    name="kidneysTender"
                                    value={values?.kidneysTender}
                                    onChange={handleChange}
                                    lable={t("kidneysTender")}
                                    respclass="col-sm-6  col-md-4 col-12"
                                    placeholder=""
                                />

                            </div>
                        </div>
                    </div>
                    <div className="col-12 col-sm-6">
                        <div
                            className="pt-3 pb-2 pr-2 pl-2 form-group"
                            style={{
                                border: "1px solid #ced4da",
                                borderRadius: "4px",
                                position: "relative",
                            }}
                        >
                            <label className="label" style={{ position: "absolute" }}>
                                {t("SKIN STATUS")}
                            </label>
                            <div className="row">
                                <Input
                                    type="text"
                                    className="form-control"
                                    id="colour"
                                    name="colour"
                                    value={values?.colour}
                                    onChange={handleChange}
                                    lable={t("colour")}
                                    respclass="col-sm-6  col-md-4 col-12"
                                    placeholder=""
                                />
                                <Input
                                    type="text"
                                    className="form-control"
                                    id="bruises"
                                    name="bruises"
                                    value={values?.bruises}
                                    onChange={handleChange}
                                    lable={t("bruises")}
                                    respclass="col-sm-6  col-md-4 col-12"
                                    placeholder=""
                                />
                                <Input
                                    type="text"
                                    className="form-control"
                                    id="rashes"
                                    name="rashes"
                                    value={values?.rashes}
                                    onChange={handleChange}
                                    lable={t("rashes")}
                                    respclass="col-sm-6  col-md-4 col-12"
                                    placeholder=""
                                />
                                <Input
                                    type="text"
                                    className="form-control"
                                    id="temperature"
                                    name="temperature"
                                    value={values?.temperature}
                                    onChange={handleChange}
                                    lable={t("temperature")}
                                    respclass="col-sm-6  col-md-4 col-12"
                                    placeholder=""
                                />
                                <Input
                                    type="text"
                                    className="form-control"
                                    id="scars"
                                    name="scars"
                                    value={values?.scars}
                                    onChange={handleChange}
                                    lable={t("scars")}
                                    respclass="col-sm-6  col-md-4 col-12"
                                    placeholder=""
                                />
                                <Input
                                    type="text"
                                    className="form-control"
                                    id="waterLowScore"
                                    name="waterLowScore"
                                    value={values?.waterLowScore}
                                    onChange={handleChange}
                                    lable={t("waterLowScore")}
                                    respclass="col-sm-6  col-md-4 col-12"
                                    placeholder=""
                                />
                                <Input
                                    type="text"
                                    className="form-control"
                                    id="woundsBurns"
                                    name="woundsBurns"
                                    value={values?.woundsBurns}
                                    onChange={handleChange}
                                    lable={t("woundsBurns")}
                                    respclass="col-sm-6  col-md-4 col-12"
                                    placeholder=""
                                />
                                <Input
                                    type="text"
                                    className="form-control"
                                    id="others9"
                                    name="others9"
                                    value={values?.others9}
                                    onChange={handleChange}
                                    lable={t("others9")}
                                    respclass="col-sm-6  col-md-4 col-12"
                                    placeholder=""
                                />
                            </div>
                        </div>
                    </div>

                    <Input
                        type="text"
                        className="form-control"
                        id="designation"
                        name="designation"
                        value={values?.designation}
                        onChange={handleChange}
                        lable={t("designation")}
                        respclass="col-sm-6 col-lg-2  col-md-4 col-12"
                        placeholder=""
                    />


                </div>
                {tableData?.length > 0 ?
                    <>
                        <Heading title={t("Physical List")} />
                        <Tables
                            thead={THEAD}
                            tbody={tableData?.map((item, index) => ({
                                SNo: index + 1,
                                entryDate: item?.entryDate1,
                                entryBy: item?.entryBy1,
                                Action: <i className="fa fa-edit" aria-hidden="true" onClick={() => { handleEdit(item) }}></i>
                            }))}
                        />
                    </>
                    : ""}
            </div>
        </div>

    )
}

export default PhysicalExamination;