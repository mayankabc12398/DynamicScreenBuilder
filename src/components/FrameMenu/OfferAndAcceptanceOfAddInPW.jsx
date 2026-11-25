import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next';
import Heading from '../UI/Heading';
import Input from '../formComponent/Input';
import DatePicker from '../formComponent/DatePicker';
import TimePicker from '../formComponent/TimePicker';
import Tables from '../UI/customTable';
import { getOfferAndAcceptancePrivateWardApi, saveOrUpdateOfferAndAcceptancePrivateWardApi } from '../../networkServices/nursingWardAPI';
import moment from 'moment';
import { notify } from '../../utils/ustil2';
export const signatureFormConfig = [
    {
        section: "patientSignature",
        title: "Signed",
        fields: [
            {
                label: "Patient Name",
                key: "patientName",
                type: "text",
                disable: true
            },
            {
                label: "Date",
                key: "patientDate",
                type: "date"
            }
        ]
    },
    {
        section: "kinSignature",
        title: "In the presence of",
        fields: [
            {
                label: "Name",
                key: "kinName",
                type: "text"
            },
            {
                label: "Date",
                key: "kinDate",
                type: "date"
            }
        ]
    },
    {
        section: "preparedBy",
        title: "Prepared by",
        fields: [
            {
                label: "Name",
                key: "preparedbyName",
                type: "text"
            },
            {
                label: "Date",
                key: "preparedbyDate",
                type: "date"
            }
        ]
    }
];

const OfferAndAcceptanceOfAddInPW = ({ data }) => {
    const { patientID, transactionID, dName, pName } = data;
    console.log(data);
    const [t] = useTranslation();
    const THEAD1 = [
        { name: t("S.No"), width: "1%" },
        { name: t("UHID"), width: "10%" },
        { name: t("created By"), width: "10%" },
        { name: t("Action"), width: "1%" },
    ]
    const [tableData, setTableData] = useState([])

    const [payload, setPayload] = useState({
        id: 0,
        patientName: pName,
        patientDate: "",
        kinName: "",
        kinDate: "",
        preparedbyName: "",
        preparedbyDate: "",

    })
    const handleChange = (e) => {
        const { name, value } = e.target;
        setPayload(prev => ({
            ...prev,
            [name]: value ?? ""
        }));
    };
    const HandleSave = async () => {
        console.log(payload);
        const payloadData = {
            ...payload,
            patientDate: payload?.patientDate ? moment(payload?.patientDate).format("DD-MM-YYYY") : "",
            kinDate: payload?.kinDate ? moment(payload?.kinDate).format("DD-MM-YYYY") : "",
            preparedbyDate: payload?.preparedbyDate ? moment(payload?.kinDate).format("DD-MM-YYYY") : "",
            patientId:patientID,
            transactionId:transactionID
        }
        const res = await saveOrUpdateOfferAndAcceptancePrivateWardApi(payloadData)
        if (res?.success) {
            notify(res?.message, "success")
            fetchDataApi()
        } else {
            notify(res?.message, "error")
        }
    }

    const fetchDataApi = async () => {
        const res = await getOfferAndAcceptancePrivateWardApi(patientID, transactionID)
        if (res?.success) {
            setTableData(res?.data)
        } else {
            notify(res?.message, "error")
            setTableData([])
        }
    }
    useEffect(()=>{
        fetchDataApi()
    },[])
    const handleEdit = (row) => {
        setPayload(prev => ({
            ...prev,
            ...row,
            patientDate: new Date(row?.patientDate),
            kinDate: new Date(row?.kinDate),
            preparedbyDate: new Date(row?.preparedbyDate),
        }));
    }
    return (
        <div className='mt-2 spatient_registration_card card'>
            {signatureFormConfig.map(section => (
                <div key={section.section}>
                    <Heading title={t(section.title)} />

                    <div className="row p-2">
                        {section.fields?.map(field => {
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
                            // if (field.type === "radio") {
                            //     return (
                            //         <ReactSelect
                            //             key={field.key}
                            //             id={field.key}
                            //             name={field.key}
                            //             placeholderName={t(field.label)}
                            //             dynamicOptions={field.options}
                            //             value={payload[field.key]}
                            //             handleChange={handleReactSelect}
                            //             removeIsClearable={true}
                            //             respclass="col-xl-3 col-md-4 col-sm-6 col-12"
                            //         />
                            //     );
                            // }


                            // if (field.type === "checkbox") {
                            //     return (
                            //         <div
                            //             key={field.key}
                            //             className="col-xl-2 col-md-4 col-sm-6 col-12"
                            //         >
                            //             <label className='row'>
                            //                 <input
                            //                     respclass={"col-2"}
                            //                     type="checkbox"
                            //                     checked={payload[field.key]}
                            //                     onChange={() => handleCheckbox(field.key)}
                            //                 />{" "}
                            //                 {t(field.label)}
                            //             </label>
                            //         </div>
                            //     );
                            // }

                            /* TEXTAREA */
                            // if (field.type === "textarea") {
                            //     return (
                            //         <TextAreaInput
                            //             respclass={"col-xl-3 col-md-4 col-sm-6 col-12"}
                            //             lable={field.label}
                            //             key={field.key}
                            //             name={field.key}
                            //             value={payload[field.key] || ""}
                            //             onChange={handleChange}
                            //             className="form-control"
                            //         />
                            //     );
                            // }
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
                    <Tables thead={THEAD1} tbody={tableData?.map((item, index) => ({
                        SNO: index + 1,
                        PatientID: item?.patientID,
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

export default OfferAndAcceptanceOfAddInPW;