import React, { useEffect, useState } from 'react'
import Heading from '../UI/Heading';
import { useTranslation } from 'react-i18next';
import Input from '../formComponent/Input';
import DatePicker from '../formComponent/DatePicker';
import TimePicker from '../formComponent/TimePicker';
import TextAreaInput from '../formComponent/TextAreaInput';
import Tables from '../UI/customTable';
import ReactSelect from '../formComponent/ReactSelect';
import moment from 'moment';
import { saveOrUpdateHospitalInfectionControlApi, getHospitalInfectionControlApi } from '../../networkServices/nursingWardAPI';
import { notify } from '../../utils/ustil2';
export const Config = [
    {
        section: "basic",
        title: "Basic Information",
        fields: [
            { label: "Department", key: "department", type: "text" },
            { label: "Date", key: "date", type: "date" },
            { label: "Time", key: "entryTime", type: "time" },
            { label: "Title", key: "title", type: "text" },
            { label: "Completed By", key: "completedBy", type: "text" }
        ]
    },

    {
        section: "infectionMeasures",
        title: "Infection Control Measures",
        type: "checkbox-group",
        rows: [
            {
                label: "Hand hygiene compliance",
                imp: "handHygiene_Imp",
                notImp: "handHygiene_NotImp",
                na: "handHygiene_NA",
                note: "handHygiene_Note"
            },
            {
                label: "Use of PPE (gloves, gowns, masks)",
                imp: "ppE_Imp",
                notImp: "ppE_NotImp",
                na: "ppE_NA",
                note: "ppE_Note"
            },
            {
                label: "Isolation precautions followed",
                imp: "isolation_Imp",
                notImp: "isolation_NotImp",
                na: "isolation_NA",
                note: "isolation_Note"
            },
            {
                label: "Equipment disinfection",
                imp: "equipment_Imp",
                notImp: "equipment_NotImp",
                na: "equipment_NA",
                note: "equipment_Note"
            },
            {
                label: "Environmental cleaning (room)",
                imp: "envClean_Imp",
                notImp: "envClean_NotImp",
                na: "envClean_NA",
                note: "envClean_Note"
            },
            {
                label: "Linen disposal procedures",
                imp: "linen_Imp",
                notImp: "linen_NotImp",
                na: "linen_NA",
                note: "linen_Note"
            },
            {
                label: "Biomedical waste disposal followed",
                imp: "bioWaste_Imp",
                notImp: "bioWaste_NotImp",
                na: "bioWaste_NA",
                note: "bioWaste_Note"
            }
        ]
    },

    {
        section: "hai",
        title: "Surveillance for Hospital-Acquired Infections (HAI)",
        type: "table",
        columns: [
            { name: "HAI Type", key: "label" },
            { name: "Cases Identified", key: "cases" },
            { name: "Sample Sent", key: "sample" },
            { name: "Culture Positive", key: "culture" },
            { name: "Remarks", key: "remarks" }
        ],
        rows: [
            {
                label: "Catheter-Associated UTI (CAUTI)",
                cases: "cautI_Cases",
                sample: "cautI_Sample",
                culture: "cautI_Culture",
                remarks: "cautI_Remarks"
            },
            {
                label: "Central Line-Associated BSI (CLABSI)",
                cases: "clabsI_Cases",
                sample: "clabsI_Sample",
                culture: "clabsI_Culture",
                remarks: "clabsI_Remarks"
            },
            {
                label: "Ventilator-Associated Pneumonia (VAP)",
                cases: "vaP_Cases",
                sample: "vaP_Sample",
                culture: "vaP_Culture",
                remarks: "vaP_Remarks"
            },
            {
                label: "Surgical Site Infection (SSI)",
                cases: "ssI_Cases",
                sample: "ssI_Sample",
                culture: "ssI_Culture",
                remarks: "ssI_Remarks"
            }
        ]
    },

    {
        section: "clinical",
        title: "Clinical Details",
        fields: [
            { label: "Date of Onset", key: "dateOfOnset", type: "date" },
            { label: "Symptoms Observed", key: "symptomsObserved", type: "text" },
            { label: "Lab Results (if available)", key: "labResults", type: "text" },
            {
                label: "Treatment Initiated",
                key: "treatmentInitiated",
                type: "radio",
                options: [
                    { label: "Yes", value: 1 },
                    { label: "No", value: 0 }
                ]
            },
            { label: "If Yes, Describe", key: "ifyesDescribe", type: "text" }
        ]
    },

    {
        section: "staffCompliance",
        title: "Staff Compliance",
        type: "checkbox-group1",
        columns: [
            { name: "Staff Role", key: "role" },
            { name: "Observed", key: "observed" },
            { name: "Compliant", key: "compliant" },
            { name: "NonCompliant", key: "nonCompliant" },
            { name: "Comments", key: "Other" }
        ],
        rows: [
            {
                role: "Nurse",
                observed: "nurse_Observed",
                compliant: "nurse_Compliant",
                nonCompliant: "nurse_NonCompliant",
                comments: "nurse_Comments"
            },
            {
                role: "Physician",
                observed: "physician_Observed",
                compliant: "physician_Compliant",
                nonCompliant: "physician_NonCompliant",
                comments: "physician_Comments"
            },
            {
                role: "Housekeeping",
                observed: "house_Observed",
                compliant: "house_Compliant",
                nonCompliant: "house_NonCompliant",
                comments: "house_Comments"
            },
            {
                role: "Lab Technician",
                observed: "lab_Observed",
                compliant: "lab_Compliant",
                nonCompliant: "lab_NonCompliant",
                comments: "lab_Comments"
            },
            {
                role: "Other",
                observed: "other_Observed",
                compliant: "other_Compliant",
                nonCompliant: "other_NonCompliant",
                comments: "other_Comments"
            }
        ]
    },

    {
        section: "staffPractices",
        title: "Staff Practices Observed",
        columns: [
            { name: "Practice", width: "1%" },
            { name: "Observed", width: "1%" },
            { name: "Remarks", width: "1%" }
        ],
        type: "select-remarks",

        rows: [
            {
                label: "Staff following aseptic techniques",
                observed: "asepticObserved",
                remarks: "asepticRemarks"
            },
            {
                label: "Gloves changed between patients",
                observed: "glovesObserved",
                remarks: "glovesRemarks"
            },
            {
                label: "Masks worn properly",
                observed: "maskObserved",
                remarks: "maskRemarks"
            },
            {
                label: "Hand hygiene after glove removal",
                observed: "handHygieneObserved",
                remarks: "handHygieneRemarks"
            }
        ]
    },


    {
        section: "corrective",
        title: "Corrective Actions Taken",
        fields: [
            { label: "Corrective Actions", key: "correctiveActions", type: "textarea" }
        ]
    },

    {
        section: "signature",
        title: "Signature and Review",
        fields: [
            { label: "Infection Control Officer Name", key: "officerName", type: "text" },
            { label: "officerDate", key: "officerDate", type: "date" },
            { label: "Comments / Recommendations", key: "officerComments", type: "text" }
        ]
    }
];

const HospitalInfectionControlForm = ({ data }) => {
    const { patientID, transactionID } = data;
    const { VITE_DATE_FORMAT } = import.meta.env;
    const [t] = useTranslation();
    const [payload, setPayload] = useState({
        id: 0,
        department: "",
        date: new Date(),
        entryTime: new Date(),
        title: "",
        completedBy: "",

        handHygiene_Imp: 0,
        handHygiene_NotImp: 0,
        handHygiene_NA: 0,
        handHygiene_Note: "",

        ppE_Imp: 0,
        ppE_NotImp: 0,
        ppE_NA: 0,
        ppE_Note: "",

        isolation_Imp: 0,
        isolation_NotImp: 0,
        isolation_NA: 0,
        isolation_Note: "",

        equipment_Imp: 0,
        equipment_NotImp: 0,
        equipment_NA: 0,
        equipment_Note: "",

        envClean_Imp: 0,
        envClean_NotImp: 0,
        envClean_NA: 0,
        envClean_Note: "",

        linen_Imp: 0,
        linen_NotImp: 0,
        linen_NA: 0,
        linen_Note: "",

        bioWaste_Imp: 0,
        bioWaste_NotImp: 0,
        bioWaste_NA: 0,
        bioWaste_Note: "",

        cautI_Cases: "",
        cautI_Sample: "",
        cautI_Culture: "",
        cautI_Remarks: "",

        clabsI_Cases: "",
        clabsI_Sample: "",
        clabsI_Culture: "",
        clabsI_Remarks: "",

        vaP_Cases: "",
        vaP_Sample: "",
        vaP_Culture: "",
        vaP_Remarks: "",

        ssI_Cases: "",
        ssI_Sample: "",
        ssI_Culture: "",
        ssI_Remarks: "",

        nurse_Observed: 0,
        nurse_Compliant: 0,
        nurse_NonCompliant: 0,
        nurse_Comments: "",

        physician_Observed: 0,
        physician_Compliant: 0,
        physician_NonCompliant: 0,
        physician_Comments: "",

        house_Observed: 0,
        house_Compliant: 0,
        house_NonCompliant: 0,
        house_Comments: "",

        lab_Observed: 0,
        lab_Compliant: 0,
        lab_NonCompliant: 0,
        lab_Comments: "",

        other_Observed: 0,
        other_Compliant: 0,
        other_NonCompliant: 0,
        other_Comments: "",

        asepticObserved: "",
        asepticRemarks: "",
        glovesObserved: "",
        glovesRemarks: "",
        maskObserved: "",
        maskRemarks: "",
        handHygieneObserved: "",
        handHygieneRemarks: "",

        correctiveActions: "",
        officerName: "",
        officerDate: "",
        officerComments: "",

        dateOfOnset: "",
        symptomsObserved: "",
        labResults: "",
        treatmentInitiated: 0,
        ifyesDescribe: "",

        patientId: "",
        transactionId: ""
    })
    const handleChange = (key, value) => {
        setPayload(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handleReactSelect = (name, val) => {
        setPayload((prev) => ({
            ...prev,
            [name]: val?.value,
        }));
    }
    const renderField = field => {
        const value = payload[field.key] || "";

        switch (field.type) {
            case "text":
                return (
                    <Input
                        type="text"
                        id={field?.key}
                        name={field.key}
                        placeholder=""
                        lable={t(field?.label)}
                        className="form-control"
                        value={value || ""}
                        onChange={e => handleChange(field.key, e.target.value)}
                    />
                );

            case "date":
                return (
                    <DatePicker
                        className="custom-calendar"
                        placeholder={VITE_DATE_FORMAT}
                        id={field.key}
                        name={field.key}
                        value={value || null}
                        lable={t(field.label)}
                        handleChange={e => handleChange(field.key, e.target.value)}
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
                        onChange={e => handleChange(field.key, e.target.value)}
                    />
                );

            case "radio":
                return (
                    // <div className="">
                    //     {field.options.map(opt => (
                    //         <label key={opt.value}>
                    //             <input
                    //                 type="radio"
                    //                 checked={payload[field.key] === opt.value}
                    //                 onChange={() => handleRadio(field.key, opt.value)}
                    //             />
                    //             {opt.label}
                    //         </label>
                    //     ))}
                    // </div>
                    <ReactSelect
                        id={field.key}
                        placeholderName={t(field.key)}
                        dynamicOptions={field?.options}
                        value={
                            field.options.find(
                                opt => opt.value === payload[field.key]
                            ) || null
                        }
                        name={field.key}
                        handleChange={handleReactSelect}
                        removeIsClearable={true}
                    />
                );

            default:
                return null;
        }
    };
    const THEAD = [
        { name: t("Measure"), width: "1%" },
        { name: t("Non-Compliant"), width: "1%" },
        { name: t("Not Implemented"), width: "1%" },
        { name: t("N/A"), width: "1%" },
        { name: t("Remarks"), width: "1%" },
    ]

    const HandleSave = async () => {
        const payloadData = {
            ...payload,
            officerDate: payload?.officerDate ? moment(payload?.officerDate).format("DD-MM-YYYY") : "",
            entryTime: payload?.entryTime ? moment(payload?.entryTime).format("DD-MM-YYYY") : "",
            dateOfOnset: payload?.dateOfOnset ? moment(payload?.dateOfOnset).format("DD-MM-YYYY") : "",
            date: payload?.date ? moment(payload?.date).format("DD-MM-YYYY") : "",
            entryTime: payload?.entryTime ? moment(payload?.entryTime).format("hh:mm A") : "",
            patientId: patientID,
            transactionId: transactionID
        }

        const res = await saveOrUpdateHospitalInfectionControlApi(payloadData)
        if (res?.success) {
            notify(res?.message, "success")
            fetchDataApi()
        } else {
            notify(res?.message, "error")
        }
    }

    const fetchDataApi = async () => {
        const res = await getHospitalInfectionControlApi(patientID, transactionID)
        if (res?.success) {
            setTableData(res?.data)
        } else {
            notify(res?.message, "error")
            setTableData([])
        }
    }
    const THEAD1 = [
        { name: t("S.No"), width: "1%" },
        { name: t("UHID"), width: "10%" },
        { name: t("created By"), width: "10%" },
        { name: t("Action"), width: "1%" },
    ]
    const [tableData, setTableData] = useState([])
    const timeFormateDate = (time) => {
        if (!time || typeof time !== "string") return null;

        // handle "Invalid date"
        if (time.toLowerCase().includes("invalid")) return null;

        // normalize 01-57 PM → 01:57 PM
        const normalizedTime = time.replace("-", ":");

        const date = new Date();

        // HH:mm:ss
        if (/^\d{2}:\d{2}:\d{2}$/.test(normalizedTime)) {
            const [h, m, s] = normalizedTime.split(":").map(Number);
            date.setHours(h, m, s, 0);
            return date;
        }

        // HH:mm
        if (/^\d{2}:\d{2}$/.test(normalizedTime)) {
            const [h, m] = normalizedTime.split(":").map(Number);
            date.setHours(h, m, 0, 0);
            return date;
        }

        // hh:mm AM/PM
        const match = normalizedTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
        if (match) {
            let [, hh, mm, period] = match;
            hh = Number(hh);
            mm = Number(mm);

            if (period.toUpperCase() === "PM" && hh !== 12) hh += 12;
            if (period.toUpperCase() === "AM" && hh === 12) hh = 0;

            date.setHours(hh, mm, 0, 0);
            return date;
        }

        return null;
    };
    const normalizeRow = (row = {}) => {
        const cleaned = {};

        Object.keys(row).forEach(key => {
            cleaned[key] = row[key] === null ? "" : row[key];
        });

        return cleaned;
    };
    const handleEdit = (row) => {
        const cleanedRow = normalizeRow(row);
        setPayload(prev => ({
            ...prev,
            ...cleanedRow,
            date: new Date(row?.date),
            dateOfOnset: new Date(row?.dateOfOnset),
            officerDate: new Date(row?.officerDate),
            entryTime: timeFormateDate(row?.entryTime)
        }));
    }
    console.log(payload);

    useEffect(() => {
        fetchDataApi()
    }, [])

    return (
        <div className='mt-2 spatient_registration_card card'>
            {/* <Heading title={t("Hospital Infection Control Form")} /> */}
            {Config?.map(section => (
                <div key={section?.section} className="mb-4">
                    <Heading title={section.title} />

                    <div className='row'>
                        {section?.fields &&
                            section?.fields.map(field => (
                                <div key={field.key} className="col-xl-2">
                                    <div className='p-2'>

                                        {renderField(field)}
                                    </div>
                                </div>
                            ))}
                    </div>

                    {section?.type === "checkbox-group" && (

                        <Tables
                            thead={THEAD}
                            tbody={
                                section?.rows?.map((row, idx) => ({
                                    Measure: row.label || row.role,
                                    Implemented: row.imp ? (
                                        <input
                                            type="checkbox"
                                            checked={payload[row.imp] === 1}
                                            onChange={() =>
                                                // handleTripleCheckbox(row.imp, row.notImp, row.na, "imp")
                                                handleChange(
                                                    row.imp,
                                                    payload[row.imp] === 1 ? 0 : 1
                                                )
                                            }
                                        />
                                    ) : "",

                                    NotImplemented: row.notImp ? (
                                        <input
                                            type="checkbox"
                                            checked={payload[row.notImp] === 1}
                                            onChange={() =>
                                                // handleTripleCheckbox(row.imp, row.notImp, row.na, "notImp")
                                                handleChange(
                                                    row.notImp,
                                                    payload[row.notImp] === 1 ? 0 : 1
                                                )
                                            }
                                        />
                                    ) : "",

                                    NA: row.na ? (
                                        <input
                                            type="checkbox"
                                            checked={payload[row.na] === 1}
                                            onChange={() =>
                                                handleChange(
                                                    row.na,
                                                    payload[row.na] === 1 ? 0 : 1
                                                )
                                            }
                                        />
                                    ) : "",

                                    Remarks: (
                                        <Input
                                            id={row?.label}
                                            className='form-control'
                                            placeholder=''
                                            type="text"
                                            value={payload[row.comments || row.note] || ""}
                                            onChange={e =>
                                                handleChange(row.comments || row.note, e.target.value)
                                            }
                                        />
                                    )
                                }))
                            }
                        />
                    )}


                    {/* HAI TABLE */}
                    {section?.type === "table" && (
                        <Tables
                            thead={section?.columns}
                            tbody={
                                section?.rows?.map((row, idx) => ({
                                    label: row?.label,
                                    cases: <Input
                                        id={row?.label}
                                        className='form-control'
                                        placeholder=''
                                        type="text"
                                        value={payload[row.cases] || ""}
                                        onChange={e =>
                                            handleChange(row.cases, e.target.value)
                                        }
                                    />,
                                    sample: <Input
                                        id={row?.label}
                                        className='form-control'
                                        placeholder=''
                                        type="text"
                                        value={payload[row.sample] || ""}
                                        onChange={e =>
                                            handleChange(row.sample, e.target.value)
                                        }
                                    />,
                                    culture: <Input
                                        id={row?.label}
                                        className='form-control'
                                        placeholder=''
                                        type="text"
                                        value={payload[row.culture] || ""}
                                        onChange={e =>
                                            handleChange(row.culture, e.target.value)
                                        }
                                    />,
                                    remarks: <Input
                                        id={row?.label}
                                        className='form-control'
                                        placeholder=''
                                        type="text"
                                        value={payload[row.remarks] || ""}
                                        onChange={e =>
                                            handleChange(row.remarks, e.target.value)
                                        }
                                    />,

                                }))
                            }
                        />
                    )}
                    {section?.type === "checkbox-group1" && (
                        <Tables
                            thead={section?.columns}
                            tbody={
                                section?.rows?.map((row, idx) => ({
                                    role: row?.role,
                                    observed: (
                                        <input
                                            type="checkbox"
                                            checked={payload[row.observed] === 1}
                                            onChange={() =>
                                                handleChange(
                                                    row.observed,
                                                    payload[row.observed] === 1 ? 0 : 1
                                                )
                                            }
                                        />
                                    ),

                                    compliant: (
                                        <input
                                            type="checkbox"
                                            checked={payload[row.compliant] === 1}
                                            onChange={() =>
                                                handleChange(
                                                    row.compliant,
                                                    payload[row.compliant] === 1 ? 0 : 1
                                                )
                                            }
                                        />
                                    ),

                                    nonCompliant: (
                                        <input
                                            type="checkbox"
                                            checked={payload[row.nonCompliant] === 1}
                                            onChange={() =>
                                                handleChange(
                                                    row.nonCompliant,
                                                    payload[row.nonCompliant] === 1 ? 0 : 1
                                                )
                                            }
                                        />
                                    ),

                                    comments: (
                                        <Input
                                            id={row.comments}
                                            className="form-control"
                                            type="text"
                                            value={payload[row.comments] || ""}
                                            onChange={e =>
                                                handleChange(row.comments, e.target.value)
                                            }
                                        />
                                    )
                                }))
                            }
                        />
                    )}
                    {/* STAFF PRACTICES */}
                    {section.type === "select-remarks" &&
                        <Tables
                            thead={section?.columns}
                            tbody={
                                section?.rows?.map((row, idx) => ({
                                    label: row?.label,
                                    observed: <ReactSelect
                                        value={payload[row.observed] || ""}
                                        placeholderName={""}
                                        id={"observed"}
                                        name={row?.observed}
                                        dynamicOptions={
                                            [{ label: t("True"), value: "1" }, { label: t("False"), value: "0" }]
                                        }
                                        handleChange={handleReactSelect}
                                        removeIsClearable={true}
                                    />,
                                    Remarks: <Input
                                        id={row.remarks}
                                        className="form-control"
                                        type="text"
                                        value={payload[row.remarks] || ""}
                                        onChange={e =>
                                            handleChange(row.remarks, e.target.value)
                                        }
                                    />
                                }))

                            }
                        />
                    }
                </div>
            ))}
            <div className="p-2">
                <button className="btn btn-sm btn-success" type="button" style={{ float: "right" }} onClick={HandleSave}>
                    {payload?.id === 0 ? t("Save") : t("Update")}
                </button>
            </div>

            {tableData?.length > 0 ?
                <>
                    <Heading title={t("Donor-Workup Checklist")} />
                    <Tables thead={THEAD1} tbody={tableData?.map((item, index) => ({
                        SNO: index + 1,
                        PatientID: item?.patientId,
                        createdBy: item?.entryBy,
                        Edit: <i className="fa fa-edit" aria-hidden="true" onClick={() => { handleEdit(item) }}></i>
                    }))}
                    />
                </>
                : ""
            }
        </div>
    )
}

export default HospitalInfectionControlForm