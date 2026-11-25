import React, { useEffect, useState } from 'react'
import Heading from '../UI/Heading';
import Tables from '../UI/customTable';
import { useTranslation } from 'react-i18next';
import DatePicker from '../formComponent/DatePicker';
import TimePicker from '../formComponent/TimePicker';
import TextAreaInput from '../formComponent/TextAreaInput';
import Input from '../formComponent/Input';
import { getHospitalRehabilitationFormApi, saveHospitalRehabilitationFormApi } from '../../networkServices/nursingWardAPI';
import { notify } from '../../utils/ustil2';
import moment from 'moment';
export const formConfig = [
    {
        "section": "Header",
        "fields": [
            { "key": "department", "label": "Department", "type": "text" },
            { "key": "rehabilitationTherapist", "label": "Rehabilitation Therapist", "type": "text" },
            { "key": "rehabDate", "label": "Date", "type": "date" }
        ]
    },
    {
        "section": "Medical Information",
        "fields": [
            { "key": "primaryDiagnosis", "label": "Primary Diagnosis", "type": "text" },
            { "key": "secondaryDiagnosis", "label": "Secondary Diagnosis", "type": "text" },
            { "key": "surgeryProcedure", "label": "Surgery / Procedure", "type": "text" },
            { "key": "dateOfSurgery", "label": "Date of Surgery", "type": "date" },
            { "key": "referringDoctor", "label": "Referring Doctor", "type": "text" },
            { "key": "consultant", "label": "Consultant", "type": "text" }
        ]
    },
    {
        "section": "Rehabilitation Plan",
        "fields": [
            {
                "key": "rehabType",
                "label": "Type of Rehabilitation",
                "type": "checkbox",
                "options": [
                    "Physical Therapy",
                    "Occupational Therapy",
                    "Speech Therapy",
                    "Cardiac Rehab",
                    "Neuro Rehab",
                    "Pulmonary Rehab",
                    "Psychiatric Rehab",
                    "Other"
                ]
            },
            {
                "key": "rehabilitationGoals",
                "label": "Rehabilitation Goals",
                "type": "textarea"
            },
            {
                "key": "frequency",
                "label": "Frequency of Sessions",
                "type": "radio",
                "options": ["DAILY", "WEEKLY", "BI_WEEKLY", "AS_ADVISED"]
            },
            {
                "key": "duration",
                "label": "Duration per Session",
                "type": "text"
            }
        ]
    },
    {
        "section": "Functional Assessment",
        "fields": [
            {
                "key": "mobility",
                "label": "Mobility",
                "type": "radio",
                "options": ["INDEPENDENT", "WITH_AID", "DEPENDENT"]
            },
            {
                "key": "communication",
                "label": "Communication",
                "type": "radio",
                "options": ["NORMAL", "IMPAIRED", "NON_VERBAL"]
            },
            {
                "key": "adl",
                "label": "Activities of Daily Living",
                "type": "radio",
                "options": ["INDEPENDENT", "PARTIAL", "DEPENDENT"]
            },
            {
                "key": "painLevel",
                "label": "Pain Level (0–10)",
                "type": "number"
            }
        ]
    },
    {
        "section": "Progress Notes",
        "fields": [
            { "key": "noteDate", "label": "Date", "type": "date" },
            { "key": "therapy", "label": "Therapy Given", "type": "text" },
            { "key": "response", "label": "Patient Response", "type": "text" },
            { "key": "therapistInitials", "label": "Therapist Initials", "type": "text" }
        ]
    },
    {
        "section": "Discharge Summary",
        "fields": [
            { "key": "dischargeDate", "label": "Discharge Date", "type": "date" },
            {
                "key": "dischargeStatus",
                "label": "Status at Discharge",
                "type": "radio",
                "options": [
                    "FULLY_RECOVERED",
                    "IMPROVED",
                    "NO_CHANGE",
                    "REFERRED",
                    "DISCONTINUED"
                ]
            },
            { "key": "remarks", "label": "Remarks", "type": "textarea" }
        ]
    }
]

const HospitalRehabilitationForm = ({ data }) => {
    const { patientID, transactionID } = data;
    const { VITE_DATE_FORMAT } = import.meta.env;
    const [t] = useTranslation();
    const [payload, setPayload] = useState({
        department: "",
        rehabilitationTherapist: "",
        rehabDate: "",

        primaryDiagnosis: "",
        secondaryDiagnosis: "",
        surgeryProcedure: "",
        dateOfSurgery: "",
        referringDoctor: "",
        consultant: "",

        // checkbox / multi-select
        rehabType: [],

        rehabilitationGoals: "",

        // radio but API expects array
        frequency: [],

        duration: "",

        // radio groups returned as array
        mobility: [],
        communication: [],
        adl: [],

        painLevel: "",

        noteDate: "",
        therapy: "",
        response: "",
        therapistInitials: "",

        dischargeDate: "",

        // radio but API expects array
        dischargeStatus: [],

        remarks: "",

        patientId: "",
        transactionId: ""

    })
    console.log(payload);
    
    const renderFieldByType = (field) => {
        const value = payload[field.key];

        switch (field.type) {
            case "date":
                return (
                    <DatePicker
                        className="custom-calendar"
                        placeholder={VITE_DATE_FORMAT}
                        id={field.key}
                        name={field.key}
                        value={value || null}
                        lable={t(field.label)}
                        handleChange={handleChange}
                    />
                );

            case "time":
                return (
                    <TimePicker
                        id={field.key}
                        name={field.key}
                        placeholder=""
                        value={value || null}
                        lable={t(field.label)}
                        handleChange={handleChange}
                    />
                );

            case "textarea":
                return (
                    <TextAreaInput
                        id={field.key}
                        name={field.key}
                        placeholder=""
                        lable={t(field.label)}
                        value={value || ""}
                        onChange={handleChange}
                    />
                );

            case "text":
                return (
                    <Input
                        type="text"
                        id={field.key}
                        name={field.key}
                        placeholder=""
                        lable={t(field.label)}
                        className="form-control"
                        value={value || ""}
                        onChange={handleChange}
                    />
                );
            case "checkbox":
                return (
                    <>
                        <label className="form-label fw-bold">
                            {t(field.label)}
                        </label>

                        {field.options?.map(option => (
                            <div key={option} className="form-check">
                                <input
                                    type="checkbox"
                                    className="form-check-input"
                                    id={`${field.key}_${option}`}
                                    checked={(value || []).includes(option)}
                                    onChange={() =>
                                        handleCheckboxChange(field.key, option)
                                    }
                                />
                                <label
                                    className="form-check-label ml-2"
                                    htmlFor={`${field.key}_${option}`}
                                >
                                    {t(option)}
                                </label>
                            </div>
                        ))}
                    </>
                );

            case "radio":
                return (
                    <>
                        <label className="form-label fw-bold">
                            {t(field.label)}
                        </label>

                        {field.options?.map(option => (
                            <div key={option} className="form-check">
                                <input
                                    type="radio"
                                    className="form-check-input"
                                    name={field.key}
                                    id={`${field.key}_${option}`}
                                    checked={value === option}
                                    onChange={() =>
                                        handleRadioChange(field.key, option)
                                    }
                                />
                                <label
                                    className="form-check-label"
                                    htmlFor={`${field.key}_${option}`}
                                >
                                    {t(option)}
                                </label>
                            </div>
                        ))}
                    </>
                );

            default: (<></>)
        }
    };

    const handleCheckboxChange = (key, option) => {
        setPayload(prev => {
            const current = prev[key] || [];
            return {
                ...prev,
                [key]: current.includes(option)
                    ? current.filter(item => item !== option)
                    : [...current, option]
            };
        });
    };
    const handleChange = (e) => {
        const { name, value } = e.target;
        setPayload(prev => ({
            ...prev,
            [name]: value
        }));
    };
    const handleRadioChange = (key, option) => {
        setPayload(prev => ({
            ...prev,
            [key]: option
        }));
    };
    const transformPayloadForApi = (payload) => {
        return {
            ...payload,
            rehabDate: payload?.rehabDate ? moment(payload?.rehabDate).format("DD-MM-YYYY") : "",
            noteDate: payload?.noteDate ? moment(payload?.noteDate).format("DD-MM-YYYY") : "",
            dischargeDate: payload?.dischargeDate ? moment(payload?.dischargeDate).format("DD-MM-YYYY") : "",
            rehabType: payload.rehabType || [],
            frequency: payload.frequency ? [payload.frequency] : [],
            mobility: payload.mobility ? [payload.mobility] : [],
            communication: payload.communication ? [payload.communication] : [],
            adl: payload.adl ? [payload.adl] : [],
            dischargeStatus: payload.dischargeStatus
                ? [payload.dischargeStatus]
                : [],
            patientId: patientID,
            transactionId: transactionID
        };
    };

    const handleSave = async () => {
        const apiPayload = transformPayloadForApi(payload);
        const res = await saveHospitalRehabilitationFormApi(apiPayload)
        if (res?.success) {
            notify(res?.message, "success")
            fetchDataApi()
        } else {
            notify(res?.message, "error")
        }
    }
    const mapGetResponseToPayload = (apiData) => {
        debugger
        return {
            department: apiData?.department || "",
            rehabilitationTherapist: apiData?.rehabilitationTherapist || "",
            rehabDate:new Date(apiData?.rehabDate)|| "",

            primaryDiagnosis: apiData?.primaryDiagnosis || "",
            secondaryDiagnosis: apiData?.secondaryDiagnosis || "",
            surgeryProcedure: apiData?.surgeryProcedure || "",
            dateOfSurgery: new Date(apiData?.dateOfSurgery) || "",

            referringDoctor: apiData?.referringDoctor || "",
            consultant: apiData?.consultant || "",

            rehabType: apiData?.rehabType
                ? apiData.rehabType.split(",")
                : [],

            rehabilitationGoals: apiData?.rehabilitationGoals || "",

            frequency: apiData?.frequency || "",
            duration: apiData?.duration || "",

            mobility: apiData?.mobility || "",
            communication: apiData?.communication || "",
            adl: apiData?.adl || "",

            painLevel: apiData?.painLevel || "",

            noteDate: new Date(apiData?.noteDate) || "",
            therapy: apiData?.therapy || "",
            response: apiData?.response || "",
            therapistInitials: apiData?.therapistInitials || "",

            dischargeDate: new Date(apiData?.dischargeDate) || "",
            dischargeStatus: apiData.dischargeStatus || "",

            remarks: apiData.remarks || "",

            patientId: apiData.patientId || "",
            transactionId: apiData.transactionId || ""
        };
    };

    const fetchDataApi = async () => {
        const res = await getHospitalRehabilitationFormApi(patientID, transactionID)
        if (res?.success) {
            const mappedPayload = mapGetResponseToPayload(res.data);
            setPayload(mappedPayload)
        } else {
            notify(res?.message,"error")
        }
    }
    useEffect(() => {
        fetchDataApi()
    }, [])
    return (
        <div className='mt-2 spatient_registration_card card'>
            <Heading title={t("Medico - Legal Register")} />
            <div className="row">
                {formConfig.map(section => (
                    <div key={section.section} className="col-12 mb-3">

                        <Heading title={t(section.section)} />

                        <div className="row p-2">
                            {section.fields.map(field => (
                                <div
                                    key={field.key}
                                    className="col-xl-2 col-md-4 col-sm-6 col-12"
                                >
                                    {renderFieldByType(field)}
                                </div>
                            ))}
                        </div>

                    </div>
                ))}
            </div>

            <div className="footer-dyamic-component">
                <button
                    className="btn btn-sm btn-primary"
                    onClick={handleSave}
                >
                    {t("Save")}
                </button>
            </div>
        </div>
    )
}

export default HospitalRehabilitationForm;