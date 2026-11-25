import React, { useEffect, useState } from 'react'
import Heading from '../UI/Heading';
import { useTranslation } from 'react-i18next';
import Input from '../formComponent/Input';
import Tables from '../UI/customTable';
import DatePicker from '../formComponent/DatePicker';
import TimePicker from '../formComponent/TimePicker';
import { getOncologyTreatmentRecordAPI, saveOrUpdateOncologyTreatmentRecordApi } from '../../networkServices/nursingWardAPI';
import { notify } from '../../utils/ustil2';
import moment from 'moment';
const OncologyTreatment = ({ data }) => {

    const { VITE_DATE_FORMAT } = import.meta.env;
    const [t] = useTranslation();
    const { patientID, transactionID } = data;
    const [payload, setPayload] = useState({
        records: {
            id: 0,
            otherId: "",
            telNo: "",
            diagnosisStage: "",
            height: "",
            weight: "",
            bsa: "",
            regiment: "",
            startDate: "",
            labStudies: "",
            pregnancyTest: "",
            wbc: "",
            absolteNeutrophil: "",
            hb: "",
            plt: "",
            bilirubin: "",
            urea: "",
            creatinine: "",
            others: "",
            prescribeBy: "",
            prescribeTime: "",
            dispensedBy: "",
            dispenseTime: "",
            administeredBy: "",
            administeredTime: "",
            care: "",
            neoadjuvant: "",
            adjuvant: "",
            palliative: ""
        },
        observations: [
            {
                "patientId": "",
                "transactionId": "",
                "no": "",
                "drugs": "",
                "date": "",
                "cycle": ""
            }
        ]
    })
    const recordFields = [
        { key: "otherId", label: t("Other ID") },
        { key: "telNo", label: t("Tel No") },
        { key: "diagnosisStage", label: t("Diagnosis Stage") },

        { key: "height", label: t("Height (cm)") },
        { key: "weight", label: t("Initial Weight (kg)") },
        { key: "bsa", label: t("BSA") },

        { key: "regiment", label: t("Regimen") },
        { key: "startDate", label: t("Start Date"), type: "date" }
    ];
    const recordFieldsExtra = [
        { key: "labStudies", label: t("Laboratory Studies") },
        { key: "pregnancyTest", label: t("Pregnancy Test") },
        { key: "wbc", label: t("WBC") },
        { key: "absolteNeutrophil", label: t("Absolute Neutrophil Count") },
        { key: "hb", label: t("Hb") },
        { key: "plt", label: t("Plt") },
        { key: "bilirubin", label: t("Bilirubin") },
        { key: "urea", label: t("Urea Nitrogen") },
        { key: "creatinine", label: t("Creatinine Levels") },
        { key: "others", label: t("Others") },

        { key: "prescribeBy", label: t("Prescribed By") },
        { key: "prescribeTime", label: t("prescribe Time"), type: "time" },

        { key: "dispensedBy", label: t("Dispensed By") },
        { key: "dispenseTime", label: t("dispense Time"), type: "time" },

        { key: "administeredBy", label: t("Administered By") },
        { key: "administeredTime", label: t("administered Time"), type: "time" }
    ];



    const emptyObservationRow = {
        patientId: "",
        transactionId: "",
        no: "",
        drugs: "",
        date: "",
        cycle: "",
        action: ""
    };
    const addObservationRow = () => {
        setPayload(prev => {
            const newRow = {
                ...emptyObservationRow,
            };

            return {
                ...prev,
                observations: [...prev.observations, newRow]
            };
        });
    };
    const removeObservationRow = (index) => {
        setPayload(prev => {
            const updated = prev.observations
                .filter((_, i) => i !== index)
                .map((row, i) => ({ ...row }));

            return {
                ...prev,
                observations: updated
            };
        });
    }

    const handleObservationChange = (index, field, value) => {
        setPayload(prev => {
            const updated = [...prev.observations];
            updated[index] = {
                ...updated[index],
                [field]: value
            };
            return {
                ...prev,
                observations: updated
            };
        });
    };

    const THEAD = [
        { name: t("S.No"), width: "1%" },
        { name: t("UHID"), width: "10%" },
        { name: t("created By"), width: "10%" },
        { name: t("Action"), width: "1%" },
    ]
    const [tableData, setTableData] = useState([])
    const fetchDataList = async () => {
        const res = await getOncologyTreatmentRecordAPI(patientID, transactionID)
        if (res?.success) {
            notify(res?.message, "success")
            setTableData(res?.data)
        } else {
            notify(res?.message, "error")
            setTableData([])
        }
    }
    console.log(payload);
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
        debugger;

        setPayload(prev => ({
            ...prev,

            records: {
                ...row.records, // ✅ keep all fields

                startDate: row?.records?.startDate
                    ? new Date(row.records.startDate)
                    : null,

                prescribeTime: timeFormateDate(row?.records?.prescribeTime),
                dispenseTime: timeFormateDate(row?.records?.dispenseTime),
                administeredTime: timeFormateDate(row?.records?.administeredTime),
            },

            observations: Array.isArray(row.observations)
                ? row.observations.map(item => ({
                    ...item,
                    date: item?.date ? new Date(item.date) : null
                }))
                : []
        }));
    };


    // const handleEdit = (row) => {
    //     debugger
    //     setPayload(prev => ({
    //         ...prev,
    //         ...row,
    //         records:{
    //             startDate: new Date(row.records.startDate) ?? new Date(),
    //             dispenseTime: timeFormateDate(row.records.dispenseTime) ?? new Date(),
    //             administeredTime: timeFormateDate(row.records.administeredTime) ?? new Date(),
    //             prescribeTime: timeFormateDate(row.records.prescribeTime) ?? new Date(),
    //         },
    //         observations:{
    //             date: new Date(row.observations.date) ?? new Date(),
    //         }
    //     }));
    // }
    console.log(payload);

    useEffect(() => {
        fetchDataList()
    }, [])
    const OBS_THEAD = [
        { name: t("No") },
        { name: t("Drugs") },
        { name: t("Date") },
        { name: t("Cycle") },
        { name: t("Action") }
    ];

    const OBS_TBODY = payload.observations.map((row, index) => ({
        No: <Input
            value={row.no}
            lable={"no"}
            placeholder={""}
            className={"form-control"}
            onChange={e =>
                handleObservationChange(index, "no", e.target.value)
            }
        />,
        Drugs: (
            <Input
                value={row.drugs}
                lable={"drugs"}
                placeholder={""}
                className={"form-control"}
                onChange={e =>
                    handleObservationChange(index, "drugs", e.target.value)
                }
            />
        ),
        Date: (
            <DatePicker
                type="date"
                lable={t("date")}
                placeholder={""}
                className={"custom-calendar"}
                value={row.date}
                handleChange={e =>
                    handleObservationChange(index, "date", e.target.value)
                }
            />
        ),
        Cycle: (
            <Input
                value={row.cycle}
                lable={"cycle"}
                placeholder={""}
                className={"form-control"}
                onChange={e =>
                    handleObservationChange(index, "cycle", e.target.value)
                }
            />
        ),
        action: (
            <div className="d-flex g-2">
                <i
                    className="fa fa-plus text-success cursor-pointer mr-2"
                    onClick={addObservationRow}
                    title={t("Add Row")}
                />
                {payload.observations.length > 1 && (
                    <i
                        className="fa fa-times text-danger cursor-pointer"
                        onClick={() => removeObservationRow(index)}
                        title={t("Remove Row")}
                    />
                )}
            </div>
        )
    }));

    const handleSave = async () => {
        const apiPayload = {
            records: {
                ...payload.records,
                patientId: patientID,
                transactionId: transactionID,
                startDate: moment(payload.records.startDate).format("DD-MM-YYYY") ?? new Date(),
                prescribeTime: moment(payload.records.prescribeTime).format("hh:mm A") ?? new Date(),
                dispenseTime: moment(payload.records.dispenseTime).format("hh:mm A") ?? new Date(),
                administeredTime: moment(payload.records.administeredTime).format("hh:mm A") ?? new Date(),
            },
            observations: payload.observations.map(item => ({
                ...item,
                patientId: patientID,
                transactionId: transactionID,
                date: moment(item.date)?.format("DD-MM-YYYY") ?? "",
            }))
        };

        const res = await saveOrUpdateOncologyTreatmentRecordApi(apiPayload)
        if (res?.success) {
            notify(res?.message, "success")
            fetchDataList()
        } else {
            notify(res?.message, "error")
        }

    };
    const handleChange = (e) => {
        const { name, value } = e.target;

        setPayload(prev => ({
            ...prev,
            records: {
                ...prev.records,
                [name]: value
            }
        }));
    };

    return (
        <div className='mt-2 spatient_registration_card card'>
            <Heading title={t("Oncology Treatmen")} isBreadcrumb={false} />
            <div className="row p-2">
                {recordFields?.map(field => (
                    <div key={field.key} className="col-xl-2 col-md-4 col-sm-6 col-12">
                        {field.type == "date" ? (

                            <DatePicker
                                className="custom-calendar"
                                placeholder={VITE_DATE_FORMAT}
                                id={field?.key}
                                name={field?.key}
                                value={payload.records[field?.key]}
                                lable={t(field?.label)}
                                handleChange={handleChange}
                            />

                        ) : (
                            <Input
                                type="text"
                                lable={field.label}
                                id={field?.key}
                                className="form-control"
                                placeholder=""
                                name={field.key}
                                value={payload.records[field.key] || ""}
                                onChange={handleChange}
                            />
                        )}
                    </div>
                ))}
                <div className="col-md-6">
                    <div className="row">
                        <label className="fw-bold ml-2">{t("Goal :")}</label>
                        {["care", "neoadjuvant", "adjuvant", "palliative"].map(key => (
                            <div key={key} className='d-flex col-xl-2'>
                                <input
                                    type="checkbox"
                                    checked={Boolean(payload.records[key])}
                                    onChange={e =>
                                        setPayload(prev => ({
                                            ...prev,
                                            records: {
                                                ...prev.records,
                                                [key]: e.target.checked ? 1 : 0
                                            }
                                        }))
                                    }
                                />{" "}
                                {key.charAt(0).toUpperCase() + key.slice(1)}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <Tables
                thead={OBS_THEAD}
                tbody={OBS_TBODY}
            />
            <div className='row p-2'>

                {recordFieldsExtra.map(field => (
                    <div key={field.key} className="col-xl-2 col-md-4 col-sm-6 col-12">
                        {field.type === "time" ? (
                            <TimePicker
                                placeholderName={t(field.label)}
                                id={field.key}
                                name={field.key}
                                value={payload.records[field.key] || ""}
                                handleChange={handleChange}
                            />
                        ) : (
                            <Input
                                type="text"
                                id={field.key}
                                lable={t(field.label)}
                                className="form-control"
                                placeholder=""
                                name={field.key}
                                value={payload.records[field.key] || ""}
                                onChange={handleChange}
                            />
                        )}
                    </div>
                ))}
            </div>

            <div className="footer-dyamic-component">
                <button
                    className="btn btn-sm btn-primary"
                    onClick={handleSave}
                >
                    {payload?.records?.id === 0 ? t("Save") : t("Update")}
                </button>

                {/* <button className="btn btn-sm btn-primary mx-2" onClick={handlePrint}>
                        {t("Print")}
                    </button> */}
            </div>

            {tableData ?
                <>
                    <Heading title={t("Donor-Workup Checklist")} />
                    <Tables thead={THEAD}
                        tbody={tableData?.records
                            ? [
                                {
                                    SNO: 1,
                                    PatientID: tableData?.records?.patientId,
                                    createdBy: tableData?.records?.entryBy,
                                    Edit: (
                                        <i
                                            className="fa fa-edit"
                                            aria-hidden="true"
                                            onClick={() => handleEdit(tableData)}
                                            style={{ cursor: "pointer" }}
                                        ></i>
                                    )
                                }
                            ]
                            : []}
                    />
                </>
                : ""
            }
        </div>
    )
}

export default OncologyTreatment