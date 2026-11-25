import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next';
import DatePicker from '../formComponent/DatePicker';
import TimePicker from '../formComponent/TimePicker';
import Input from '../formComponent/Input';
import Heading from '../UI/Heading';
import TextAreaInput from '../formComponent/TextAreaInput';
import { saveOrUpdateMedicoLegalRegisterApi, getMedicoLegalRegisterApi } from '../../networkServices/nursingWardAPI';
import moment from 'moment';
import { notify } from '../../utils/ustil2';
import Tables from '../UI/customTable';

const MedicoLegalRegister = ({ data }) => {
    const { patientID, transactionID } = data;
    const { VITE_DATE_FORMAT } = import.meta.env;
    const [t] = useTranslation()
    const mlcRecordFields = [
        // ================= BASIC DETAILS =================
        { key: "mlcNo", label: t("M.L.C. No"), type: "text" },
        { key: "examinationDate", label: t("Examination Date"), type: "date" },
        { key: "examinationTime", label: t("Examination Time"), type: "time" },

        // ================= REFERRED DETAILS =================
        { key: "referredByName", label: t("Brought / Referred By (Name)"), type: "text" },
        { key: "referredByAddress", label: t("Brought / Referred By (Address)"), type: "text" },
        { key: "referredById", label: t("ID"), type: "text" },
        { key: "relationship", label: t("Relationship"), type: "text" },

        // ================= BROUGHT IN =================
        { key: "broughtInDateTime", label: t("Brought In Date"), type: "date" },
        { key: "broughtInTime", label: t("Brought In Time"), type: "time" },

        // ================= IDENTIFICATION =================
        { key: "identificationMarks", label: t("Identification Marks"), type: "textarea", col: 12 },

        // ================= MEDICAL DETAILS =================
        { key: "causeOfInjury", label: t("Cause of Injury"), type: "textarea", col: 12 },
        { key: "conditionOnArrival", label: t("Condition on Arrival"), type: "textarea", col: 12 },
        { key: "detailsOfInjuries", label: t("Details of Injuries / Clinical Features"), type: "textarea", col: 12 },

        // ================= INVESTIGATION & TREATMENT =================
        { key: "investigations", label: t("Investigations"), type: "textarea", col: 6 },
        { key: "treatmentSummary", label: t("Summary of Treatment"), type: "textarea", col: 6 },

        // ================= POLICE INFO ON ADMISSION =================
        { key: "policeAdmissionInformedDate", label: t("Police Date Informed"), type: "date" },
        { key: "policeAdmissionInformedTime", label: t("Police Time Informed"), type: "time" },
        { key: "policeAdmissionArrivedDate", label: t("Police Date Arrived"), type: "date" },
        { key: "policeAdmissionArrivedTime", label: t("Police Time Arrived"), type: "time" },
        { key: "policeAdmissionStation", label: t("Police Station"), type: "text" },
        { key: "policeAdmissionConstable", label: t("Constable Name"), type: "text" },
        { key: "policeAdmissionBuckleNo", label: t("Buckle No"), type: "text" },

        // ================= POLICE INFO ON DISCHARGE =================
        { key: "policeDischargeInformedDate", label: t("Discharge Date Informed"), type: "date" },
        { key: "policeDischargeInformedTime", label: t("Discharge Time Informed"), type: "time" },
        { key: "policeDischargeArrivedDate", label: t("Discharge Date Arrived"), type: "date" },
        { key: "policeDischargeArrivedTime", label: t("Discharge Time Arrived"), type: "time" },
        { key: "policeDischargeStation", label: t("Police Station"), type: "text" },
        { key: "policeDischargeConstable", label: t("Constable Name"), type: "text" },
        { key: "policeDischargeBuckleNo", label: t("Buckle No"), type: "text" },

        // ================= DISCHARGE DETAILS =================
        { key: "dischargeMOName", label: t("Name of M.O."), type: "text" },
        { key: "dischargeDesignation", label: t("Designation"), type: "text" },
        { key: "dischargeRegNo", label: t("Reg. No"), type: "text" }
    ];

    const [payload, setPayload] = useState({
        id: 0,
        mlcNo: "",
        examinationDate: new Date(),
        examinationTime: new Date(),

        referredByName: "",
        referredByAddress: "",
        referredById: "",
        relationship: "",

        broughtInDateTime: new Date(),
        broughtInTime: new Date(),

        identificationMarks: "",

        causeOfInjury: "",
        conditionOnArrival: "",
        detailsOfInjuries: "",

        investigations: "",
        treatmentSummary: "",

        // Police Information on Admission
        policeAdmissionInformedDate: new Date(),
        policeAdmissionInformedTime: new Date(),
        policeAdmissionArrivedDate: new Date(),
        policeAdmissionArrivedTime: new Date(),
        policeAdmissionStation: "",
        policeAdmissionConstable: "",
        policeAdmissionBuckleNo: "",

        // Police Information on Discharge
        policeDischargeInformedDate: new Date(),
        policeDischargeInformedTime: new Date(),
        policeDischargeArrivedDate: new Date(),
        policeDischargeArrivedTime: new Date(),
        policeDischargeStation: "",
        policeDischargeConstable: "",
        policeDischargeBuckleNo: "",

        // Discharge Details
        dischargeMOName: "",
        dischargeDesignation: "",
        dischargeRegNo: "",

        // Meta
        patientId: "",
        transactionId: ""
    }
    );
    const THEAD = [
        { name: t("S.No"), width: "1%" },
        { name: t("UHID"), width: "10%" },
        { name: t("created By"), width: "10%" },
        { name: t("Action"), width: "1%" },
    ]
    const [isSave, setIsSave] = useState(false)
    const [tableData, setTableData] = useState([])
    const handleChange = (e) => {
        const { name, value } = e.target;
        setPayload(prev => ({
            ...prev,
            [name]: value
        }));
    };
    const handleSave = async () => {
        const payloaddata = {
            ...payload,
            examinationDate: payload?.examinationDate ? moment(payload?.examinationDate).format("DD-MM-YYYY") : "",
            broughtInDateTime: payload?.broughtInDateTime ? moment(payload?.broughtInDateTime).format("DD-MM-YYYY") : "",
            policeAdmissionInformedDate: payload?.policeAdmissionInformedDate ? moment(payload?.policeAdmissionInformedDate).format("DD-MM-YYYY") : "",
            policeAdmissionArrivedDate: payload?.policeAdmissionArrivedDate ? moment(payload?.policeAdmissionArrivedDate).format("DD-MM-YYYY") : "",
            policeDischargeInformedDate: payload?.policeDischargeInformedDate ? moment(payload?.policeDischargeInformedDate).format("DD-MM-YYYY") : "",
            policeDischargeArrivedDate: payload?.policeDischargeArrivedDate ? moment(payload?.policeDischargeArrivedDate).format("DD-MM-YYYY") : "",
            policeAdmissionInformedTime: payload?.policeAdmissionInformedTime ? moment(payload?.policeAdmissionInformedTime).format("hh:mm A") : "",
            policeAdmissionArrivedTime: payload?.policeAdmissionArrivedTime ? moment(payload?.policeAdmissionArrivedTime).format("hh:mm A") : "",
            policeDischargeInformedTime: payload?.policeDischargeInformedTime ? moment(payload?.policeDischargeInformedTime).format("hh:mm A") : "",
            policeDischargeArrivedTime: payload?.policeDischargeArrivedTime ? moment(payload?.policeDischargeArrivedTime).format("hh:mm A") : "",
            examinationTime: payload?.examinationTime ? moment(payload?.examinationTime).format("hh:mm A") : "",
            broughtInTime: payload?.broughtInTime ? moment(payload?.broughtInTime).format("hh:mm A") : "",
            patientId: patientID,
            transactionId: transactionID,
        }
        console.log(payloaddata);

        const res = await saveOrUpdateMedicoLegalRegisterApi(payloaddata)
        if (res?.success) {
            notify(res?.message, "success")
            fetchDataList()
        } else {
            notify(res?.message, "error")
        }
    }
    const fetchDataList = async () => {
        const res = await getMedicoLegalRegisterApi(patientID)
        if (res?.success) {
            notify(res?.message, "success")
            setTableData(res?.data)
            setIsSave("false")
        } else {
            notify(res?.message, "error")
            setTableData([])
            setIsSave("true")
        }
    }
    useEffect(() => {
        fetchDataList()
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
            examinationDate: new Date(row?.examinationDate),
            policeAdmissionInformedDate: new Date(row?.policeAdmissionInformedDate),
            policeAdmissionArrivedDate: new Date(row?.policeAdmissionArrivedDate),
            policeDischargeInformedDate: new Date(row?.policeDischargeInformedDate),
            policeDischargeArrivedDate: new Date(row?.policeDischargeArrivedDate),
            policeAdmissionInformedTime: timeFormateDate(row?.policeAdmissionInformedTime),
            policeAdmissionArrivedTime: timeFormateDate(row?.policeAdmissionArrivedTime),
            policeDischargeInformedTime: timeFormateDate(row?.policeDischargeInformedTime),
            policeDischargeArrivedTime: timeFormateDate(row?.policeDischargeArrivedTime),
            broughtInDateTime: timeFormateDate(row?.broughtInDateTime),
            broughtInTime: timeFormateDate(row?.broughtInTime),
            examinationTime: timeFormateDate(row?.examinationTime),

        }));
        setIsSave("true")
    }
    console.log(payload);

    return (
        <div className='mt-2 spatient_registration_card card'>
            <Heading title={t("Medico - Legal Register")} />
            <div className="row p-2">
                {mlcRecordFields.map(field => (
                    <div
                        key={field.key}
                        className={`col-xl-2 col-md-4 col-sm-6 col-12`}
                    >
                        {field.type === "date" && (
                            <DatePicker
                                className="custom-calendar"
                                placeholder={VITE_DATE_FORMAT}
                                id={field.key}
                                name={field.key}
                                value={payload[field.key]}
                                lable={t(field.label)}
                                handleChange={handleChange}
                            />
                        )}

                        {field.type === "time" && (
                            <TimePicker
                                id={field.key}
                                name={field.key}
                                placeholder={field.key}
                                value={payload[field.key]}
                                lable={t(field.label)}
                                handleChange={handleChange}
                            />
                        )}

                        {field.type === "textarea" && (
                            <TextAreaInput
                                id={field.key}
                                name={field.key}
                                placeholder={""}
                                lable={t(field.key)}
                                className=""
                                value={payload[field.key] || ""}
                                onChange={handleChange}
                            />
                        )}

                        {(!field.type || field.type === "text") && (
                            <Input
                                type="text"
                                id={field.key}
                                name={field.key}
                                placeholder={""}
                                lable={t(field.label)}
                                className="form-control"
                                value={payload[field.key] || ""}
                                onChange={handleChange}
                            />
                        )}
                    </div>
                ))}
            </div>
            {isSave == 'true' ?
                <div className="footer-dyamic-component">
                    <button
                        className="btn btn-sm btn-primary"
                        onClick={handleSave}
                    >
                        {payload?.id === 0 ? t("Save") : t("Update")}
                    </button>
                </div>
                : ""}
            {tableData ?
                <>
                    <Heading title={t("")} />
                    <Tables thead={THEAD}
                        tbody={tableData?.map((item) => ({
                            SNO: 1,
                            PatientID: item?.patientId,
                            createdBy: item?.createdBy,
                            Edit: (
                                <i
                                    className="fa fa-edit"
                                    aria-hidden="true"
                                    onClick={() => handleEdit(item)}
                                    style={{ cursor: "pointer" }}
                                ></i>)

                        }))}
                    />
                </>
                : ""
            }
        </div>
    )
}

export default MedicoLegalRegister;