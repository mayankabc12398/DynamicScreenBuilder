import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Heading from '../UI/Heading'
import LabeledInput from '../formComponent/LabeledInput'
import Input from '../formComponent/Input'
import { getDiagnosisByPatientIdApi, saveFetalDisposalApi, getFetalDisposalDetailsApi } from '../../networkServices/Emergency'
import { notify } from '../../utils/ustil2'

const FETALDISPOSALFORM = ({ data }) => {
    console.log(data);

    const { PatientID, InDateTime, Name, transactionID } = data;
    const { t } = useTranslation()
    const date = InDateTime?.slice(0, 11);      // "10-Nov-2025"
    const time = InDateTime?.slice(12);

    const [diagonosys, setDiagonosys] = useState("")
    const [values, setValues] = useState({
        Name: "",
        Relationship: "",
        Desease: ""
    })
    const handleSave = async () => {
        const payload = {
            patientId: PatientID ? PatientID : "",
            transactionId: transactionID ? transactionID : "",
            name: values?.Name,
            relationship: values?.Relationship,
            desease: values?.Desease
        }

        const resp = await saveFetalDisposalApi(payload)
        if (resp?.success) {
            notify(resp?.message, "success")
            getPatientPanelList()
        } else {
            notify(resp?.message, "error")

        }
    }
    const getPatientPanelList = async () => {
        const resp = await getFetalDisposalDetailsApi(transactionID)
        if (resp?.success) {
            setValues({
                ...values,
                ID: resp?.data[0]?.ID || 0,
                Name: resp?.data[0]?.Name || "",
                Relationship: resp?.data[0]?.Relationship || "",
                Desease: resp?.data[0]?.Desease || ""
            });
        } else {
            notify(resp?.message, "error")
        }
    }
    console.log("data", values);

    const handleChange = (e) => {
        const { name, value } = e.target
        setValues((val) => ({ ...val, [name]: value }))
    }
    const getDiagonosys = async () => {
        const resp = await getDiagnosisByPatientIdApi(PatientID)
        if (resp?.success) {
            setDiagonosys(resp?.data?.Diagnosis)
        } else {
            notify(resp?.message, "error")
        }
    }
    useEffect(() => {
        getDiagonosys()
        getPatientPanelList()
    }, [])
    console.log("values", diagonosys);

    return (
        <div className="card">
            <Heading title={t("FETAL DISPOSAL FORM")} />
            <div className="row p-2">
                <div className="col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12">
                    <LabeledInput
                        label={t("Department Unit")}
                        value={values?.DepartmentUnit}
                    />
                </div>
                <div className="col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12">
                    <LabeledInput
                        label={t("Date")}
                        value={date ? date : ""}
                    />
                </div>
                <div className="col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12">
                    <LabeledInput
                        label={t("Time")}
                        value={time ? time : ""}
                    />
                </div>
                <div className="col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12">
                    <LabeledInput
                        label={t("Patient Name")}
                        value={Name ? Name : ""}
                    />
                </div>
                <div className="col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12">
                    <LabeledInput
                        label={t("Diagnosis")}
                        value={diagonosys ? diagonosys : ""}
                    />
                </div>
                <div className="col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12">
                    <LabeledInput
                        label={t("Visit Number")}
                        value={PatientID}
                    />
                </div>

            </div>

            <div className='card text-bold p-2'>
                <div className='d-block d-lg-flex'>
                    <span>I</span>
                    <Input
                        type="text"
                        className="form-control"
                        id="Name"
                        name="Name"
                        value={values?.Name ? values?.Name : ""}
                        onChange={handleChange}
                        lable={t("Name")}
                        respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                        placeholder=""
                    />

                    <span>{t("of ID No")}</span>
                    <Input
                        type="text"
                        className="form-control"
                        id="relationship"
                        name="Relationship"
                        value={values?.Relationship ? values?.Relationship : ""}
                        onChange={handleChange}
                        lable={t("relationship")}
                        respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                        placeholder=" "
                    />
                    <span>{t("relationship to the deceased")}</span>
                    <Input
                        type="text"
                        className="form-control"
                        id="Desease"
                        name="Desease"
                        value={values?.Desease ? values?.Desease : ""}
                        onChange={handleChange}
                        lable={t("Desease")}
                        respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                        placeholder=" "
                    />

                    <span>
                        {t("do hereby authorize The Karen Hospital to dispose of the foetus.")}
                    </span>
                </div>

                <section>
                    {t("In signing this I absolve the hospital from any legal issues if they arise.")}
                </section>
                <section>{t("Mother's signature / Father's signature / Guardian's signature")}</section>
                <section>{t("Nurse's signature")}</section>
            </div>
            <div className='flex'>
                {/* <button className="btn btn-sm btn-success m-2" style={{ float: "right" }}>
                    {t("Print")}
                </button> */}
                <button className="btn btn-sm btn-success m-2" style={{ float: "right" }} onClick={handleSave}>
                    {values?.ID ?t("Update"): t("Save")}
                </button>
            </div>
        </div>
    )
}

export default FETALDISPOSALFORM;