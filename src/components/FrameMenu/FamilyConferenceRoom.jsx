import React, { useEffect, useState } from 'react'
import Heading from '../UI/Heading';
import { useTranslation } from 'react-i18next';
import ReactSelect from '../formComponent/ReactSelect';
import Input from '../formComponent/Input';
import TextAreaInput from '../formComponent/TextAreaInput';
import DatePicker from '../formComponent/DatePicker';
import TimePicker from '../formComponent/TimePicker';
import { getPatientFamilyConferenceApi, saveOrUpdatePatientFamilyConferenceApi } from '../../networkServices/nursingWardAPI';
import moment from 'moment';
import { notify } from '../../utils/ustil2';
import Tables from '../UI/customTable';
export const familyConferenceFormConfig = [
    {
        section: "basicInfo",
        title: "Family Conference Form",
        fields: [
            {
                label: "Resuscitation Directive",
                key: "resuscitationDirective",
                type: "radio",
                options: [
                    { label: "Yes", value: "1" },
                    { label: "No", value: "0" }
                ]
            },
            {
                label: "Ward",
                key: "ward",
                type: "text"
            },
            {
                label: "Primary Nurse",
                key: "primaryNurse",
                type: "text"
            }
        ]
    },

    {
        section: "reasonOfMeeting",
        title: "Reason of Meeting",
        fields: [
            {
                label: "Goals of Care",
                key: "goalsOfCare",
                type: "checkbox"
            },
            {
                label: "Resuscitation Status",
                key: "resuscitationstatus",
                type: "checkbox"
            },
            {
                label: "Progress Report / Status",
                key: "progressRepeort",
                type: "checkbox"
            },
            {
                label: "Other",
                key: "other",
                type: "checkbox"
            },
            {
                label: "Specify Other",
                key: "other1",
                type: "text",
                visibleIf: "other"
            }
        ]
    },

    {
        section: "meetingDetails",
        title: "Meeting Details",
        fields: [
            {
                label: "Meeting Location",
                key: "meetingLocation",
                type: "text"
            },
            {
                label: "Meeting Time",
                key: "time",
                type: "time"
            }
        ]
    },

    {
        section: "patientDetails",
        title: "Patient Details",
        fields: [
            {
                label: "Patient Attended Conference",
                key: "patientAttendentConference",
                type: "radio",
                options: [{ label: "Yes", value: "yes" }, { label: "No", value: "no" }, { label: "Other", value: "other" }]
            },
            {
                label: "Patient Diagnosis",
                key: "patientDiagnosis",
                type: "text"
            },
            {
                label: "Prognosis",
                key: "prognosis",
                type: "text"
            },
            {
                label: "Doctor Recommendation",
                key: "doctorRecommendation",
                type: "text"
            },
            {
                label: "Specify Other",
                key: "rblTxtOther",
                type: "text",
                visibleIf: "patientAttendentConference",
                visibleIfValue: "other"
            }
        ]
    },

    {
        section: "agreement",
        title: "Agree to the Following",
        fields: [
            {
                label: "Active Resuscitation & Escalation to ICU/HDU",
                key: "activeResuscitationEscalation",
                type: "radio",
                options: [
                    { label: "Yes", value: "1" },
                    { label: "No", value: "0" }
                ]
            },
            {
                label: "Mechanical Ventilation",
                key: "machanicalVentilation",
                type: "radio",
                options: [
                    { label: "Yes", value: "1" },
                    { label: "No", value: "0" }
                ]
            },
            {
                label: "Oxygen Supplementation",
                key: "oxygenSupplementaion",
                type: "radio",
                options: [
                    { label: "Yes", value: "1" },
                    { label: "No", value: "0" }
                ]
            },
            {
                label: "Inotropic Support",
                key: "inotropicSupport",
                type: "radio",
                options: [
                    { label: "Yes", value: "1" },
                    { label: "No", value: "0" }
                ]
            },
            {
                label: "Dialysis",
                key: "dialysis",
                type: "radio",
                options: [
                    { label: "Yes", value: "1" },
                    { label: "No", value: "0" }
                ]
            },
            {
                label: "Complex Treatments (Chemotherapy)",
                key: "complexTreatments",
                type: "radio",
                options: [
                    { label: "Yes", value: "1" },
                    { label: "No", value: "0" }
                ]
            },
            {
                label: "Intravenous Feeding",
                key: "intravenousFeeding",
                type: "radio",
                options: [
                    { label: "Yes", value: "1" },
                    { label: "No", value: "0" }
                ]
            },
            {
                label: "Other (Specify)",
                key: "otherSpecify",
                type: "text"
            }
        ]
    },

    {
        section: "familyWishes",
        title: "Family Wishes / Concerns",
        fields: [
            {
                label: "family Wishes Concerns",
                key: "familyWishesConcerns",
                type: "textarea"
            }
        ]
    },

    {
        section: "nextOfKin",
        title: "Next of Kin / Decision Maker",
        fields: [
            {
                label: "Name",
                key: "nextOfKin",
                type: "text"
            },
            {
                label: "Relationship to Patient",
                key: "relationshiptoPatient",
                type: "radio",
                options: [
                    { label: "Self", value: "self" },
                    { label: "Father", value: "father" },
                    { label: "Son", value: "son" },
                    { label: "Wife", value: "wife" },
                    { label: "Daughter", value: "daughter" },
                    { label: "Husband", value: "husband" },
                    { label: "Guard", value: "guard" },
                    { label: "Mother", value: "mother" },
                    { label: "Brother", value: "brother" },
                    { label: "Sister", value: "sister" },
                    { label: "Uncle", value: "uncle" },
                    { label: "Other", value: "other" }
                ]
            },
            {
                label: "Date",
                key: "date1",
                type: "date"
            }
        ]
    },

    {
        section: "otherFamilyMembers",
        title: "Other Family Members Present",
        repeatable: true,
        max: 5,
        keys: [
            "otherFamilyMemberPresent",
            "otherFamilyMemberPresent1",
            "otherFamilyMemberPresent2",
            "otherFamilyMemberPresent3",
            "otherFamilyMemberPresent4"
        ]
    },

    {
        section: "doctorDetails",
        title: "Doctor Details",
        fields: [
            {
                label: "Primary Doctor",
                disable: true,
                key: "primaryDoctor",
                type: "text"
            },
            {
                label: "Specialty",
                key: "specialty",
                type: "text"
            },
            {
                label: "Witness",
                key: "witness",
                type: "text"
            },
            {
                label: "Meeting Ended Time",
                key: "meetingEndedTime",
                type: "time"
            },
            {
                label: "Date",
                key: "date2",
                type: "date"
            }
        ]
    }
];

const FamilyConferenceRoom = ({ data }) => {
    const { patientID, transactionID, dName } = data;

    const [t] = useTranslation();
    const [payload, setPayload] = useState({
        id: 0,
        patientID: "",
        transactionID: "",
        patientName: "",
        age: "",
        ipdno: "",
        ward: "",
        primaryDoctor: dName,
        specialty: "",
        primaryNurse: "",
        ipAddress: "",

        resuscitationDirective: "",

        goalsOfCare: false,
        resuscitationstatus: false,
        progressRepeort: true,
        other: false,
        other1: "",

        meetingLocation: "",
        time: "",
        time2: "",

        patientAttendentConference: "",
        patientDiagnosis: "",
        prognosis: "",
        doctorRecommendation: "",

        activeResuscitationEscalation: "",
        machanicalVentilation: "",
        oxygenSupplementaion: "",
        inotropicSupport: "",
        dialysis: "",
        complexTreatments: "",
        intravenousFeeding: "",
        otherSpecify: "",

        familyWishesConcerns: "",

        nextOfKin: "",
        relationshiptoPatient: "",
        date1: "",
        date2: "",

        witness: "",
        meetingEndedTime: "",

        otherFamilyMemberPresent: "",
        otherFamilyMemberPresent1: "",
        otherFamilyMemberPresent2: "",
        otherFamilyMemberPresent3: "",
        otherFamilyMemberPresent4: "",

        otherDoctor: "",
        rblTxtOther: ""
    })
    const handleChange = (e) => {
        const { name, value } = e.target;
        setPayload(prev => ({
            ...prev,
            [name]: value ?? ""
        }));
    };

    const handleCheckbox = (key) => {
        setPayload(prev => {
            const updated = {
                ...prev,
                [key]: !prev[key]
            };


            if (key === "other" && prev.other === true) {
                updated.other1 = "";
            }

            return updated;
        });
    };
    const familyMemberKeys = [
        "otherFamilyMemberPresent",
        "otherFamilyMemberPresent1",
        "otherFamilyMemberPresent2",
        "otherFamilyMemberPresent3",
        "otherFamilyMemberPresent4"
    ];
    const addFamilyMember = () => {
        if (memberCount < familyMemberKeys.length) {
            setMemberCount(prev => prev + 1);
        }
    };

    const removeFamilyMember = (index) => {
        const key = familyMemberKeys[index];

        setPayload(prev => ({
            ...prev,
            [key]: ""
        }));

        setMemberCount(prev => prev - 1);
    };
    console.log(payload);

    const [memberCount, setMemberCount] = useState(1);
    const THEAD = [
        { name: t("S.No"), width: "1%" },
        { name: t("Patient Name"), width: "10%" },
        { name: t("Primary Doctor"), width: "10%" },
        { name: t("Age"), width: "10%" },
        { name: t("Primary Nurse"), width: "10%" },
        { name: t("Meeting Location"), width: "10%" },
        { name: t("Patient Diagnosis"), width: "10%" },
        { name: t("Prognosis"), width: "10%" },
        { name: t("Specialty"), width: "10%" },
        { name: t("created By"), width: "10%" },
        { name: t("Action"), width: "1%" },
    ]
    const [tableData, setTableData] = useState([])

    const HandleSave = async () => {

        const payloadData = {
            ...payload,
            date1: payload?.date1 ? moment(payload?.date1).format("DD-MM-YYYY") : "",
            date2: payload?.date2 ? moment(payload?.date2).format("DD-MM-YYYY") : "",
            time: payload?.time ? moment(payload?.time).format("hh:mm A") : "",
            time2: payload?.time2 ? moment(payload?.time2).format("hh:mm A") : "",
            meetingEndedTime: payload?.meetingEndedTime ? moment(payload?.meetingEndedTime).format("hh:mm A") : "",
            patientId: patientID,
            transactionId: transactionID
        }

        const res = await saveOrUpdatePatientFamilyConferenceApi(payloadData)
        if (res?.success) {
            notify(res?.message, "success")
            fetchDataApi()
        } else {
            notify(res?.message, "error")
        }

    };
    const fetchDataApi = async () => {
        const res = await getPatientFamilyConferenceApi(patientID, transactionID)
        if (res?.success) {
            setTableData(res?.data)
        } else {
            notify(res?.message, "error")
            setTableData([])
        }
    }
    useEffect(() => {
        fetchDataApi()
    }, [])
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

    const handleEdit = (row) => {


        setPayload(prev => ({
            ...prev,
            ...row,
            date1: new Date(row?.date1),
            date2: new Date(row?.date2),
            time: timeFormateDate(row?.time1),
            time2: timeFormateDate(row?.time2),
            meetingEndedTime: timeFormateDate(row?.meetingEndedTime)
        }));
    }
    console.log(payload);

    const handleReactSelect = (name, val) => {
        setPayload((prev) => ({
            ...prev,
            [name]: val?.value ?? "",
            ...(name === "patientAttendentConference" && val?.value !== "other"
                ? { rblTxtOther: "" }
                : {})
        }));
    }
    return (
        <div className='mt-2 spatient_registration_card card'>

            {familyConferenceFormConfig.map(section => (
                <div key={section.section}>
                    <Heading title={t(section.title)} />

                    <div className="row p-2">
                        {section.repeatable && section.section === "otherFamilyMembers" && (
                            <>
                                {section.keys.slice(0, memberCount).map((key, index) => (
                                    <div
                                        key={key}
                                        className="col-xl-3 col-md-4 col-sm-6 col-12 d-flex"
                                        style={{ gap: "10px" }}
                                    >
                                        <Input
                                            type="text"
                                            className="form-control"
                                            lable={`Family Member`}
                                            name={key}
                                            value={payload[key] || ""}
                                            onChange={handleChange}
                                        />

                                        {memberCount > 1 && (
                                            <button
                                                type="button"
                                                className="btn btn-danger btn-sm"
                                                onClick={() => removeFamilyMember(index)}
                                            >
                                                −
                                            </button>
                                        )}
                                    </div>
                                ))}

                                {memberCount < section.max && (
                                    <div className="col-12 mt-2">
                                        <button
                                            type="button"
                                            className="btn btn-primary btn-sm"
                                            onClick={addFamilyMember}
                                        >
                                            + Add Family Member
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                        {!section.repeatable && section.fields?.map(field => {
                            if (field.visibleIf) {
                                const dependentValue = payload[field.visibleIf];

                                // Case 1: visibleIfValue is defined (radio/select match)
                                if (
                                    field.visibleIfValue !== undefined &&
                                    dependentValue !== field.visibleIfValue
                                ) {
                                    return null;
                                }

                                // Case 2: only visibleIf (checkbox true/false)
                                if (
                                    field.visibleIfValue === undefined &&
                                    !dependentValue
                                ) {
                                    return null;
                                }
                            }

                            if (field.visibleIf && !payload[field.visibleIf]) {
                                return null;
                            }

                            if (field.type === "text") {
                                return (
                                    <Input
                                        type={"text"}
                                        className={"form-control"}
                                        placeholder={""}
                                        id={field.key}
                                        lable={field.key}
                                        disabled={field?.disable}
                                        key={field.key}
                                        name={field.key}
                                        value={payload[field.key] || ""}
                                        onChange={handleChange}
                                        respclass="col-xl-3 col-md-4 col-sm-6 col-12"
                                    />
                                );
                            }
                            debugger
                            if (field.type === "radio") {
                                return (
                                    <ReactSelect
                                        key={field.key}
                                        id={field.key}
                                        name={field.key}
                                        placeholderName={t(field.label)}
                                        dynamicOptions={field.options}
                                        value={payload[field.key]}
                                        handleChange={handleReactSelect}
                                        removeIsClearable={true}
                                        respclass="col-xl-3 col-md-4 col-sm-6 col-12"
                                    />
                                );
                            }


                            if (field.type === "checkbox") {
                                return (
                                    <div
                                        key={field.key}
                                        className="col-xl-2 col-md-4 col-sm-6 col-12"
                                    >
                                        <label className='row'>
                                            <input
                                                respclass={"col-2"}
                                                type="checkbox"
                                                checked={payload[field.key]}
                                                onChange={() => handleCheckbox(field.key)}
                                            />{" "}
                                            {t(field.label)}
                                        </label>
                                    </div>
                                );
                            }

                            /* TEXTAREA */
                            if (field.type === "textarea") {
                                return (
                                    <TextAreaInput
                                        respclass={"col-xl-3 col-md-4 col-sm-6 col-12"}
                                        lable={field.label}
                                        key={field.key}
                                        name={field.key}
                                        value={payload[field.key] || ""}
                                        onChange={handleChange}
                                        className="form-control"
                                    />
                                );
                            }
                            if (field.type === "date") {
                                return (
                                    <DatePicker
                                        key={field.key}
                                        lable={t(field.label)}
                                        name={field.key}
                                        value={payload[field.key]}
                                        handleChange={handleChange}
                                        respclass="col-xl-3 col-md-4 col-sm-6 col-12"
                                    />
                                );
                            }
                            if (field.type === "time") {
                                return (
                                    <TimePicker
                                        placeholderName={t("Time")}
                                        key={field.key}
                                        lable={t(field.label)}
                                        name={field.key}
                                        value={payload[field.key]}
                                        handleChange={handleChange}
                                        respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                                    />
                                );
                            }

                            return null;
                        })}
                    </div>
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
                    <Tables thead={THEAD} tbody={tableData?.map((item, index) => ({
                        SNO: index + 1,
                        patientName: item?.patientName,
                        primaryDoctor: item?.primaryDoctor,
                        age: item?.age,
                        primaryNurse: item?.primaryNurse,
                        meetingLocation: item?.meetingLocation,
                        patientDiagnosis: item?.patientDiagnosis,
                        prognosis: item?.prognosis,
                        specialty: item?.specialty,
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

export default FamilyConferenceRoom;