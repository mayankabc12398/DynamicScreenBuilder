import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Input from '../formComponent/Input';
import Heading from '../UI/Heading';
import ReactSelect from '../formComponent/ReactSelect';
import DatePicker from '../formComponent/DatePicker';
import TextAreaInput from '../formComponent/TextAreaInput';
import moment from 'moment';
import { notify } from '../../utils/ustil2';
import { getBrainDeathDiagnosisApi, saveOrUpdateBrainDeathDiagnosisApi } from '../../networkServices/nursingWardAPI';
import Tables from '../UI/customTable';

const BrainDeathDiagnosis = ({ data }) => {
    const { patientID, transactionID } = data
    const [payload, setPayload] = useState({
        id: 0,
        patientId: "",
        transactionID: "",
        diagnosis: "",
        temperature: "",
        patientComatose: "",
        causeofComatose: "",
        primirilyHyperthermia: "",
        profoundMetabolic: "",

        causeofRespiratory: "",
        respiratoryFailure: "",
        irreversibleStructural: "",
        irreversibleStructuralBrainDemage: "",
        painfulStimulation: "",
        papillaryReaction: "",
        occulo_Cephalic: "",
        cornealReflex: "",
        vestibuleOcular: "",
        coughOrGag: "",
        arterialPco2: "",
        pco2Start: "",
        pco2Discontinuation: "",
        durationTest: "",
        apnoeicTest: "",
        testsToBeRepeated: "",
        durationByWhom: "",
        hrsAndBy: "",
        adequatelyInformed: "",
        noReason: "",
        personInformed: "",
        relationshipPatient: "",
        dateInformed: new Date(),
        testersFullName: "",
        date: new Date(),
        speciality: "",
    })
    const { VITE_DATE_FORMAT } = import.meta.env;

    const [t] = useTranslation();
    const handleChange = (e) => {
        const { name, value } = e.target;
        setPayload((val) => ({ ...val, [name]: value }))
    };
    const handleReactSelect = (name, val) => {
        setPayload((prev) => ({
            ...prev,
            [name]: val,
        }));
    }
    const TRUE_FALSE_OPTIONS = [
        { label: t("Yes"), value: "1" },
        { label: t("No"), value: "0" },
    ];
    const [tableData, setTableData] = useState([])
    const buildPayload = (values, patientID, transactionID) => {
        debugger
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

    const HandleSave = async () => {

        let payloadData = buildPayload(payload, patientID, transactionID);
        payloadData = {
            ...payloadData,
            date: moment(payload?.date).format("DD-MM-YYYY"),
            dateInformed: moment(payload?.dateInformed).format("DD-MM-YYYY"),
        };
        const res = await saveOrUpdateBrainDeathDiagnosisApi(payloadData)
        if (res?.success) {
            notify(res?.message, "success")
            fetchDataList()
        } else {
            notify(res?.message, "error")

        }
    }
    const handleEdit = (item) => {
        setPayload(prev => ({
            ...prev,
            ...item,
            date:new Date(item?.date),
            dateInformed:new Date(item?.dateInformed)
        }));
    }
    const THEAD = [
        { name: t("S.No"), width: "1%" },
        { name: t("UHID"), width: "10%" },
        { name: t("created By"), width: "10%" },
        { name: t("Action"), width: "1%" },
    ]
    const fetchDataList = async () => {
        const res = await getBrainDeathDiagnosisApi(patientID)
        if (res?.success) {
            setTableData(res?.data)
        } else {
            notify(res?.message, "error")
            setTableData([])
        }
    }
    console.log(tableData);

    useEffect(() => {
        fetchDataList()
    }, [])
    return (
        <div className='mt-2 spatient_registration_card card'>
            <Heading title={t("Brain Death Diagnosis")} />
            <div className='row p-2'>
                <Input
                    type="text"
                    className="form-control"
                    id="Diagnosis"
                    name="Diagnosis"
                    value={payload?.Diagnosis}
                    onChange={handleChange}
                    lable={t("Diagnosis")}
                    placeholder=""
                    respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                />
                <Input
                    type="text"
                    className="form-control"
                    id="temperature"
                    name="temperature"
                    value={payload?.temperature}
                    onChange={handleChange}
                    lable={t("temperature")}
                    placeholder=""
                    respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                />

                <div className="col-12">
                    <div
                        className="pt-3 pb-2 pr-2 pl-2 form-group"
                        style={{
                            border: "1px solid #ced4da",
                            borderRadius: "4px",
                            position: "relative",
                        }}
                    >
                        <label className="label" style={{ position: "absolute" }}>
                            {t("Indications (the folllowing indications must co-exists)")}
                        </label>
                        <div className="row">
                            <ReactSelect
                                placeholderName={t("Is the patient comatose? GCS of 3")}
                                name="patientComatose"
                                value={String(payload?.patientComatose?.value ?? payload?.patientComatose ?? 0)}
                                handleChange={handleReactSelect}
                                dynamicOptions={TRUE_FALSE_OPTIONS}
                                searchable={false}
                                id="patientComatose"
                                respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                removeIsClearable={true}
                            />
                            <ReactSelect
                                placeholderName={t("Have the drugs been ruled out as a cause of comatose state")}
                                name="causeofComatose"
                                value={String(payload?.causeofComatose?.value ?? payload?.causeofComatose ?? 0)}
                                handleChange={handleReactSelect}
                                dynamicOptions={TRUE_FALSE_OPTIONS}
                                searchable={false}
                                id="causeofComatose"
                                respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                removeIsClearable={true}
                            />
                            <ReactSelect
                                placeholderName={t("Has primirily hyperthermia been ruled out")}
                                name="primirilyHyperthermia"
                                value={String(payload?.primirilyHyperthermia?.value ?? payload?.primirilyHyperthermia ?? 0)}
                                handleChange={handleReactSelect}
                                dynamicOptions={TRUE_FALSE_OPTIONS}
                                searchable={false}
                                id="primirilyHyperthermia"
                                respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                removeIsClearable={true}
                            />
                            <ReactSelect
                                placeholderName={t("Has profound metabolic or endocrine disturbance been ruled out")}
                                name="profoundMetabolic"
                                value={String(payload?.profoundMetabolic?.value ?? payload?.profoundMetabolic ?? 0)}
                                handleChange={handleReactSelect}
                                dynamicOptions={TRUE_FALSE_OPTIONS}
                                searchable={false}
                                id="profoundMetabolic"
                                respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                removeIsClearable={true}
                            />
                            <ReactSelect
                                placeholderName={t("IS the patient in respiratory failure")}
                                name="respiratoryFailure"
                                value={String(payload?.respiratoryFailure?.value ?? payload?.respiratoryFailure ?? 0)}
                                handleChange={handleReactSelect}
                                dynamicOptions={TRUE_FALSE_OPTIONS}
                                searchable={false}
                                id="respiratoryFailure"
                                respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                removeIsClearable={true}
                            />
                            <ReactSelect
                                placeholderName={t("Have the drugs been ruled out as the cause of respiratory failure :")}
                                name="causeofRespiratory"
                                value={String(payload?.causeofRespiratory?.value ?? payload?.causeofRespiratory ?? 0)}
                                handleChange={handleReactSelect}
                                dynamicOptions={TRUE_FALSE_OPTIONS}
                                searchable={false}
                                id="causeofRespiratory"
                                respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                removeIsClearable={true}
                            />
                            <TextAreaInput
                                type="text"
                                name="irreversibleStructuralBrainDemage"
                                rows={2}
                                value={payload?.irreversibleStructuralBrainDemage}
                                onChange={handleChange}
                                lable={t("State the cause leading to irreversible structural brain damage:")}
                                placeholder=" "
                                respclass=" col-sm-6 col-12"
                                className="form-control required-fields"
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
                            {t("Diagnostic Tests")}
                        </label>
                        <div className="row">
                            <ReactSelect
                                placeholderName={t("Is there motor response to painful stimulation in an area of cranial nerve distribution?")}
                                name="painfulStimulation"
                                value={String(payload?.painfulStimulation?.value ?? payload?.painfulStimulation ?? 0)}
                                handleChange={handleReactSelect}
                                dynamicOptions={TRUE_FALSE_OPTIONS}
                                searchable={false}
                                id="painfulStimulation"
                                respclass="col-md-4 col-sm-6 col-12"
                                removeIsClearable={true}
                            />
                            <ReactSelect
                                placeholderName={t("Is there papillary reaction?")}
                                name="papillaryReaction"
                                value={String(payload?.papillaryReaction?.value ?? payload?.papillaryReaction ?? 0)}
                                handleChange={handleReactSelect}
                                dynamicOptions={TRUE_FALSE_OPTIONS}
                                searchable={false}
                                id="papillaryReaction"
                                respclass="col-md-4 col-sm-6 col-12"
                                removeIsClearable={true}
                            />
                            <ReactSelect
                                placeholderName={t("Is there an occulo-cephalic reflex? (Dolls eye movements)?")}
                                name="occulo_Cephalic"
                                value={String(payload?.occulo_Cephalic?.value ?? payload?.occulo_Cephalic ?? 0)}
                                handleChange={handleReactSelect}
                                dynamicOptions={TRUE_FALSE_OPTIONS}
                                searchable={false}
                                id="occulo_Cephalic"
                                respclass="col-md-4 col-sm-6 col-12"
                                removeIsClearable={true}
                            />
                            <ReactSelect
                                placeholderName={t("Is there a Corneal reflex?")}
                                name="cornealReflex"
                                value={String(payload?.cornealReflex?.value ?? payload?.cornealReflex ?? 0)}
                                handleChange={handleReactSelect}
                                dynamicOptions={TRUE_FALSE_OPTIONS}
                                searchable={false}
                                id="cornealReflex"
                                respclass="col-md-4 col-sm-6 col-12"
                                removeIsClearable={true}
                            />
                            <ReactSelect
                                placeholderName={t("Is there a Vestibule-occular reflex? (Caloric Test)")}
                                name="vestibuleOcular"
                                value={String(payload?.vestibuleOcular?.value ?? payload?.vestibuleOcular ?? 0)}
                                handleChange={handleReactSelect}
                                dynamicOptions={TRUE_FALSE_OPTIONS}
                                searchable={false}
                                id="vestibuleOcular"
                                respclass="col-md-4 col-sm-6 col-12"
                                removeIsClearable={true}
                            />
                            <ReactSelect
                                placeholderName={t("Is there a Cough or gag reflex?")}
                                name="coughOrGag"
                                value={String(payload?.coughOrGag?.value ?? payload?.coughOrGag ?? 0)}
                                handleChange={handleReactSelect}
                                dynamicOptions={TRUE_FALSE_OPTIONS}
                                searchable={false}
                                id="coughOrGag"
                                respclass="col-md-4 col-sm-6 col-12"
                                removeIsClearable={true}
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
                            {t("APNOEIC TEST")}
                        </label>
                        <div className="row">
                            <ReactSelect
                                placeholderName={t("Is there any respiratory effort when potential is disconnected from mechanical ventilation for a period of time allowing the arterial PCO2 to rise to > 50 mmHg of 6.6Kpa?")}
                                name="arterialPco2"
                                value={String(payload?.arterialPco2?.value ?? payload?.arterialPco2 ?? 0)}
                                handleChange={handleReactSelect}
                                dynamicOptions={TRUE_FALSE_OPTIONS}
                                searchable={false}
                                id="arterialPco2"
                                respclass="col-md-4 col-sm-6 col-12"
                                removeIsClearable={true}
                            />
                            <Input
                                type="text"
                                className="form-control"
                                id="pco2Start"
                                name="pco2Start"
                                value={payload?.pco2Start}
                                onChange={handleChange}
                                lable={t("PCO2 at start of test")}
                                placeholder=""
                                respclass="col-md-4 col-sm-6 col-12"
                            />
                            <Input
                                type="text"
                                className="form-control"
                                id="pco2Discontinuation"
                                name="pco2Discontinuation"
                                value={payload?.pco2Discontinuation}
                                onChange={handleChange}
                                lable={t("PCO2 at disconnnected of test")}
                                placeholder=""
                                respclass="col-md-4 col-sm-6 col-12"
                            />
                            <Input
                                type="text"
                                className="form-control"
                                id="durationTest"
                                name="durationTest"
                                value={payload?.durationTest}
                                onChange={handleChange}
                                lable={t("Duration of test")}
                                placeholder=""
                                respclass="col-md-4 col-sm-6 col-12"
                            />
                            <ReactSelect
                                placeholderName={t("In the absence of ABGs, a ten minute period of apnea be an acceptable criteria (Provided patient not hypothermic).Is there a respiratory effort during ten minute Apnoeic Test?")}
                                name="apnoeicTest"
                                value={String(payload?.apnoeicTest?.value ?? payload?.apnoeicTest ?? 0)}
                                handleChange={handleReactSelect}
                                dynamicOptions={TRUE_FALSE_OPTIONS}
                                searchable={false}
                                id="apnoeicTest"
                                respclass="col-md-4 col-sm-6 col-12"
                                removeIsClearable={true}
                            />
                        </div>
                    </div>

                </div>

                <ReactSelect
                    placeholderName={t("Do you wish the tests to be repeated?")}
                    name="testsToBeRepeated"
                    value={String(payload?.testsToBeRepeated?.value ?? payload?.testsToBeRepeated ?? 0)}
                    handleChange={handleReactSelect}
                    dynamicOptions={TRUE_FALSE_OPTIONS}
                    searchable={false}
                    id="testsToBeRepeated"
                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                    removeIsClearable={true}
                />
                <Input
                    type="text"
                    className="form-control"
                    id="durationByWhom"
                    name="durationByWhom"
                    value={payload?.durationByWhom}
                    onChange={handleChange}
                    lable={t("If Yes, state after what duration and by Whom")}
                    placeholder=""
                    respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                />
                <Input
                    type="text"
                    className="form-control"
                    id="hrsAndBy"
                    name="hrsAndBy"
                    value={payload?.hrsAndBy}
                    onChange={handleChange}
                    lable={t("hrs And By")}
                    placeholder=""
                    respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                />
                <ReactSelect
                    placeholderName={t("MeaslesHas the next of kin been adequately informed about the patient condition and potential outcome?")}
                    name="adequatelyInformed"
                    value={String(payload?.adequatelyInformed?.value ?? payload?.adequatelyInformed ?? 0)}
                    handleChange={handleReactSelect}
                    dynamicOptions={TRUE_FALSE_OPTIONS}
                    searchable={false}
                    id="adequatelyInformed"
                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                    removeIsClearable={true}
                />
                <Input
                    type="text"
                    className="form-control"
                    id="noReason"
                    name="noReason"
                    value={payload?.noReason}
                    onChange={handleChange}
                    lable={t("noReason")}
                    placeholder=""
                    respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                />
                <Input
                    type="text"
                    className="form-control"
                    id="personInformed"
                    name="personInformed"
                    value={payload?.personInformed}
                    onChange={handleChange}
                    lable={t("personInformed")}
                    placeholder=""
                    respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                />
                <Input
                    type="text"
                    className="form-control"
                    id="relationshipPatient"
                    name="relationshipPatient"
                    value={payload?.relationshipPatient}
                    onChange={handleChange}
                    lable={t("relationshipPatient")}
                    placeholder=""
                    respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                />
                <DatePicker
                    className={`custom-calendar `}
                    respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                    id="dateInformed"
                    name="dateInformed"
                    inputClassName={"required-fields"}
                    value={payload?.dateInformed ? payload?.dateInformed : ""}
                    handleChange={handleChange}
                    lable={t("dateInformed")}
                    placeholder={VITE_DATE_FORMAT}
                />
                <Input
                    type="text"
                    className="form-control"
                    id="testersFullName"
                    name="testersFullName"
                    value={payload?.testersFullName}
                    onChange={handleChange}
                    lable={t("testersFullName")}
                    placeholder=""
                    respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                />
                <DatePicker
                    className={`custom-calendar `}
                    respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                    id="date"
                    name="date"
                    inputClassName={"required-fields"}
                    value={payload?.date ? payload?.date : ""}
                    handleChange={handleChange}
                    lable={t("Date")}
                    placeholder={VITE_DATE_FORMAT}
                />
                <Input
                    type="text"
                    className="form-control"
                    id="speciality"
                    name="speciality"
                    value={payload?.speciality}
                    onChange={handleChange}
                    lable={t("speciality")}
                    placeholder=""
                    respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                />
            </div>
            <div className='p-2'>
                <button className="btn btn-sm btn-success" type="button" style={{ float: "right" }} onClick={HandleSave}>
                    {payload?.id === 0 ? t("Save") : t("Update")}
                </button>
            </div>
            {tableData?.length > 0 ?
                <>
                    <Heading title={t("Data List")} />
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
        </div>
    )
}

export default BrainDeathDiagnosis;